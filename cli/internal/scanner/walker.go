package scanner

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
)

// DefaultSkipDirs are directories that are always skipped.
var DefaultSkipDirs = map[string]bool{
	"node_modules": true,
	".git":         true,
	"vendor":       true,
	"dist":         true,
	"build":        true,
	".next":        true,
	"__pycache__":  true,
	".venv":        true,
	"venv":         true,
}

// WalkerOptions configures the file walker.
type WalkerOptions struct {
	Path           string
	IsDir          bool
	Extensions     []string
	IgnorePatterns []string
}

// Walker walks a directory tree and returns FileContext objects for eligible files.
type Walker struct {
	opts WalkerOptions
	exts map[string]bool
}

// NewWalker creates a new file walker.
func NewWalker(opts WalkerOptions) *Walker {
	exts := make(map[string]bool)
	for _, e := range opts.Extensions {
		exts[strings.ToLower(e)] = true
	}
	return &Walker{opts: opts, exts: exts}
}

// Walk collects all eligible FileContext objects concurrently.
func (w *Walker) Walk() ([]FileContext, error) {
	if !w.opts.IsDir {
		fc, err := w.readFile(w.opts.Path, w.opts.Path)
		if err != nil {
			return nil, err
		}
		return []FileContext{*fc}, nil
	}

	// Collect file paths first
	var paths []string
	err := filepath.Walk(w.opts.Path, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // skip errors
		}

		if info.IsDir() {
			if DefaultSkipDirs[info.Name()] {
				return filepath.SkipDir
			}
			return nil
		}

		// Check extension
		ext := strings.ToLower(filepath.Ext(path))
		base := filepath.Base(path)

		// .env files have no extension match, check filename directly
		if ext == "" && (base == ".env" || strings.HasPrefix(base, ".env.")) {
			ext = ".env"
		}

		if !w.exts[ext] {
			return nil
		}

		// Check ignore patterns
		relPath, _ := filepath.Rel(w.opts.Path, path)
		if w.shouldIgnore(relPath) {
			return nil
		}

		paths = append(paths, path)
		return nil
	})

	if err != nil {
		return nil, err
	}

	// Read files concurrently
	numWorkers := runtime.NumCPU()
	if numWorkers > len(paths) {
		numWorkers = len(paths)
	}
	if numWorkers < 1 {
		numWorkers = 1
	}

	type result struct {
		fc  *FileContext
		err error
	}

	pathCh := make(chan string, len(paths))
	resultCh := make(chan result, len(paths))

	var wg sync.WaitGroup
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for p := range pathCh {
				fc, err := w.readFile(p, w.opts.Path)
				resultCh <- result{fc, err}
			}
		}()
	}

	for _, p := range paths {
		pathCh <- p
	}
	close(pathCh)

	go func() {
		wg.Wait()
		close(resultCh)
	}()

	var files []FileContext
	for r := range resultCh {
		if r.err == nil && r.fc != nil {
			files = append(files, *r.fc)
		}
	}

	return files, nil
}

func (w *Walker) readFile(path, basePath string) (*FileContext, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	relPath, err := filepath.Rel(basePath, path)
	if err != nil {
		relPath = path
	}

	absPath, _ := filepath.Abs(path)

	lines := strings.Split(string(content), "\n")

	return &FileContext{
		Path:      relPath,
		AbsPath:   absPath,
		Content:   content,
		Lines:     lines,
		Extension: strings.ToLower(filepath.Ext(path)),
		Filename:  filepath.Base(path),
	}, nil
}

func (w *Walker) shouldIgnore(relPath string) bool {
	for _, pattern := range w.opts.IgnorePatterns {
		if matched, _ := filepath.Match(pattern, relPath); matched {
			return true
		}
		if matched, _ := filepath.Match(pattern, filepath.Base(relPath)); matched {
			return true
		}
	}
	return false
}
