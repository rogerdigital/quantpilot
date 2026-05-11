import type {
  PromotionDecision,
  PromotionGate,
  PromotionRequest,
  PromotionStatus,
} from '../../shared-types/src/lifecycle.ts';

export class PromotionStore {
  private promotions: Map<string, PromotionRequest> = new Map();

  create(request: PromotionRequest): PromotionRequest {
    this.promotions.set(request.id, structuredClone(request));
    return structuredClone(request);
  }

  get(id: string): PromotionRequest | null {
    const p = this.promotions.get(id);
    return p ? structuredClone(p) : null;
  }

  list(): PromotionRequest[] {
    return [...this.promotions.values()].map((p) => structuredClone(p));
  }

  listByStrategy(strategyCandidateId: string): PromotionRequest[] {
    return [...this.promotions.values()]
      .filter((p) => p.strategyCandidateId === strategyCandidateId)
      .map((p) => structuredClone(p));
  }

  updateStatus(id: string, status: PromotionStatus): PromotionRequest | null {
    const p = this.promotions.get(id);
    if (!p) return null;
    p.status = status;
    p.updatedAt = new Date().toISOString();
    return structuredClone(p);
  }

  addDecision(id: string, decision: PromotionDecision): PromotionRequest | null {
    const p = this.promotions.get(id);
    if (!p) return null;
    p.decisions.push(decision);
    p.updatedAt = new Date().toISOString();
    return structuredClone(p);
  }

  updateGate(id: string, gate: PromotionGate): PromotionRequest | null {
    const p = this.promotions.get(id);
    if (!p) return null;
    const idx = p.gates.findIndex((g) => g.key === gate.key);
    if (idx >= 0) {
      p.gates[idx] = gate;
    } else {
      p.gates.push(gate);
    }
    p.updatedAt = new Date().toISOString();
    return structuredClone(p);
  }

  submit(id: string): PromotionRequest | null {
    return this.updateStatus(id, 'submitted');
  }

  approvePaper(id: string, decision: PromotionDecision): PromotionRequest | null {
    const p = this.promotions.get(id);
    if (!p) return null;
    if (p.status !== 'submitted' && p.status !== 'risk_reviewed') return null;
    p.decisions.push(decision);
    p.status = 'approved_for_paper';
    p.updatedAt = new Date().toISOString();
    return structuredClone(p);
  }

  approveLive(id: string, decision: PromotionDecision): PromotionRequest | null {
    const p = this.promotions.get(id);
    if (!p) return null;
    if (p.status !== 'paper_observed') return null;
    p.decisions.push(decision);
    p.status = 'approved_for_live';
    p.updatedAt = new Date().toISOString();
    return structuredClone(p);
  }

  reject(id: string, decision: PromotionDecision): PromotionRequest | null {
    const p = this.promotions.get(id);
    if (!p) return null;
    if (!decision.reason) return null;
    p.decisions.push(decision);
    p.status = 'suspended';
    p.updatedAt = new Date().toISOString();
    return structuredClone(p);
  }

  suspend(id: string, decision: PromotionDecision): PromotionRequest | null {
    const p = this.promotions.get(id);
    if (!p) return null;
    if (!decision.reason) return null;
    p.decisions.push(decision);
    p.status = 'suspended';
    p.updatedAt = new Date().toISOString();
    return structuredClone(p);
  }
}
