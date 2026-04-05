import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { JurisdictionRule } from '../../database/entities/jurisdiction-rule.entity';

export interface JurisdictionRuleViolation {
  ruleId: string;
  ruleName: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
}

export interface JurisdictionRulesResult {
  valid: boolean;
  violations: JurisdictionRuleViolation[];
  rulesEvaluated: number;
}

@Injectable()
export class JurisdictionRulesService {
  private readonly logger = new Logger(JurisdictionRulesService.name);

  constructor(
    @InjectRepository(JurisdictionRule)
    private readonly jurisdictionRuleRepository: Repository<JurisdictionRule>,
  ) {}

  /**
   * Load all active rules for a given jurisdiction, effective as of today.
   */
  async loadRules(jurisdiction: string): Promise<JurisdictionRule[]> {
    const today = new Date().toISOString().split('T')[0];

    const rules = await this.jurisdictionRuleRepository.find({
      where: [
        {
          jurisdiction: jurisdiction.toUpperCase(),
          isActive: true,
          effectiveFrom: LessThanOrEqual(today) as any,
          effectiveTo: MoreThanOrEqual(today) as any,
        },
        {
          jurisdiction: jurisdiction.toUpperCase(),
          isActive: true,
          effectiveFrom: LessThanOrEqual(today) as any,
          effectiveTo: IsNull(),
        },
      ],
      order: { ruleName: 'ASC', version: 'DESC' },
    });

    this.logger.debug(
      `Loaded ${rules.length} active rules for jurisdiction ${jurisdiction}`,
    );

    return rules;
  }

  /**
   * Evaluate data against all active jurisdiction-specific rules.
   * Uses json-rules-engine for rule evaluation.
   */
  async evaluateRules(
    data: Record<string, unknown>,
    jurisdiction: string,
  ): Promise<JurisdictionRulesResult> {
    const rules = await this.loadRules(jurisdiction);
    const violations: JurisdictionRuleViolation[] = [];

    try {
      const { Engine } = await import('json-rules-engine');
      const engine = new Engine();

      // Add each jurisdiction rule to the engine
      for (const rule of rules) {
        const ruleDefinition = rule.ruleDefinition as any;
        engine.addRule({
          name: rule.ruleName,
          conditions: ruleDefinition.conditions ?? { all: [] },
          event: {
            type: ruleDefinition.eventType ?? 'violation',
            params: {
              ruleId: rule.id,
              ruleName: rule.ruleName,
              severity: ruleDefinition.severity ?? 'ERROR',
              message: ruleDefinition.message ?? `Rule "${rule.ruleName}" violated`,
            },
          },
        });
      }

      // Run the engine
      const { events } = await engine.run(data);

      for (const event of events) {
        const params = event.params as Record<string, unknown>;
        violations.push({
          ruleId: params.ruleId as string,
          ruleName: params.ruleName as string,
          severity: params.severity as 'ERROR' | 'WARNING',
          message: params.message as string,
        });
      }
    } catch (error) {
      this.logger.error(
        `Jurisdiction rules evaluation failed for ${jurisdiction}`,
        error,
      );
      violations.push({
        ruleId: 'SYSTEM',
        ruleName: 'engine-error',
        severity: 'ERROR',
        message: `Rules engine error: ${(error as Error).message}`,
      });
    }

    const valid = !violations.some((v) => v.severity === 'ERROR');

    this.logger.debug(
      `Jurisdiction rules evaluation: jurisdiction=${jurisdiction}, rulesEvaluated=${rules.length}, violations=${violations.length}`,
    );

    return { valid, violations, rulesEvaluated: rules.length };
  }
}
