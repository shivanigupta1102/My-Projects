export type ComplianceSeverity = 'BLOCKING' | 'ERROR' | 'WARNING' | 'INFO';
export type ComplianceGateStatus = 'PASSED' | 'BLOCKED' | 'PENDING';

export interface ChannelComplianceReport {
  channel: string;
  gate: ComplianceGateStatus;
  blockingCount: number;
  warningCount: number;
  checks: ComplianceCheckData[];
}

export interface ComplianceCheckData {
  ruleId: string;
  severity: ComplianceSeverity;
  field: string;
  currentValue?: string;
  violation: string;
  suggestedFix: string;
  autoFixAvailable: boolean;
  externalPolicyUrl?: string;
}
