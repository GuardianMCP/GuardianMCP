import { Plan } from '@/common/enums';

export interface PlanLimits {
  maxServers: number;
  maxScansPerMonth: number;
  maxApiKeys: number;
  maxAlertRules: number;
  maxMembers: number;
  htmlReports: boolean;
  slackAlerts: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  [Plan.FREE]: {
    maxServers: 3,
    maxScansPerMonth: 50,
    maxApiKeys: 1,
    maxAlertRules: 0,
    maxMembers: 1,
    htmlReports: false,
    slackAlerts: false,
  },
  [Plan.PRO]: {
    maxServers: 25,
    maxScansPerMonth: 500,
    maxApiKeys: 5,
    maxAlertRules: 10,
    maxMembers: 10,
    htmlReports: true,
    slackAlerts: true,
  },
  [Plan.ENTERPRISE]: {
    maxServers: Infinity,
    maxScansPerMonth: Infinity,
    maxApiKeys: Infinity,
    maxAlertRules: Infinity,
    maxMembers: Infinity,
    htmlReports: true,
    slackAlerts: true,
  },
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS[Plan.FREE];
}
