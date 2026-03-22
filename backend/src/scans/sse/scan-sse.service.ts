import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class ScanSseService {
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  getStream(scanId: string): Observable<MessageEvent> {
    if (!this.streams.has(scanId)) {
      this.streams.set(scanId, new Subject<MessageEvent>());
    }
    return this.streams.get(scanId)!.asObservable();
  }

  emit(scanId: string, event: { type: string; data: any }): void {
    const subject = this.streams.get(scanId);
    if (subject) {
      subject.next({
        type: event.type,
        data: JSON.stringify(event.data),
      } as MessageEvent);
    }
  }

  complete(scanId: string): void {
    const subject = this.streams.get(scanId);
    if (subject) {
      subject.complete();
      this.streams.delete(scanId);
    }
  }
}
