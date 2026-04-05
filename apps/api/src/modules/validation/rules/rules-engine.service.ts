import { Injectable, Logger } from '@nestjs/common';

export interface RuleDefinition {
  name: string;
  conditions: Record<string, unknown>;
  event: {
    type: string;
    params: Record<string, unknown>;
  };
  priority?: number;
}

export interface RuleEvaluationResult {
  events: Array<{
    type: string;
    params: Record<string, unknown>;
  }>;
  almanac: Record<string, unknown>;
}

@Injectable()
export class RulesEngineService {
  private readonly logger = new Logger(RulesEngineService.name);
  private engine: any;
  private readonly ruleMap = new Map<string, RuleDefinition>();

  constructor() {
    this.initEngine();
  }

  private async initEngine(): Promise<void> {
    try {
      const { Engine } = await import('json-rules-engine');
      this.engine = new Engine();
      this.logger.log('json-rules-engine initialized');
    } catch (error) {
      this.logger.error('Failed to initialize json-rules-engine', error);
    }
  }

  /**
   * Add a rule to the engine.
   */
  async addRule(rule: RuleDefinition): Promise<void> {
    if (!this.engine) {
      await this.initEngine();
    }

    this.engine.addRule({
      name: rule.name,
      conditions: rule.conditions,
      event: rule.event,
      priority: rule.priority ?? 1,
    });

    this.ruleMap.set(rule.name, rule);
    this.logger.debug(`Rule added: ${rule.name}`);
  }

  /**
   * Remove a rule by name.
   */
  async removeRule(ruleName: string): Promise<boolean> {
    if (!this.engine) {
      return false;
    }

    try {
      this.engine.removeRule(ruleName);
      this.ruleMap.delete(ruleName);
      this.logger.debug(`Rule removed: ${ruleName}`);
      return true;
    } catch {
      this.logger.warn(`Failed to remove rule: ${ruleName}`);
      return false;
    }
  }

  /**
   * Evaluate facts against all loaded rules.
   */
  async evaluate(facts: Record<string, unknown>): Promise<RuleEvaluationResult> {
    if (!this.engine) {
      await this.initEngine();
    }

    try {
      const { events, almanac } = await this.engine.run(facts);
      this.logger.debug(
        `Rule evaluation complete: ${events.length} events triggered from ${this.ruleMap.size} rules`,
      );
      return {
        events: events.map((e: any) => ({ type: e.type, params: e.params })),
        almanac: {},
      };
    } catch (error) {
      this.logger.error('Rule evaluation failed', error);
      throw error;
    }
  }

  /**
   * Get all currently loaded rule names.
   */
  getLoadedRules(): string[] {
    return [...this.ruleMap.keys()];
  }

  /**
   * Clear all rules and reinitialize the engine.
   */
  async reset(): Promise<void> {
    this.ruleMap.clear();
    await this.initEngine();
    this.logger.log('Rules engine reset');
  }
}
