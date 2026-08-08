import { helpdeskEnterpriseRepository, CreateEnterpriseTicketDTO, TicketFilterDTO } from '../repositories/helpdeskEnterpriseRepository.js';

export class HelpdeskEnterpriseService {
  async createTicket(dto: CreateEnterpriseTicketDTO, requesterId: number) {
    return helpdeskEnterpriseRepository.createTicket(dto, requesterId);
  }

  async getTickets(userRole: string, requesterId: number, filters?: TicketFilterDTO) {
    return helpdeskEnterpriseRepository.getTickets(userRole, requesterId, filters);
  }

  async getTicketById(ticketId: number, userRole: string, requesterId: number) {
    return helpdeskEnterpriseRepository.getTicketById(ticketId, userRole, requesterId);
  }

  async assignTicket(ticketId: number, agentId: number, assignerId: number) {
    return helpdeskEnterpriseRepository.assignTicket(ticketId, agentId, assignerId);
  }

  async updateStatus(ticketId: number, status: string, resolutionNotes: string | undefined, actorId: number) {
    return helpdeskEnterpriseRepository.updateStatus(ticketId, status, resolutionNotes, actorId);
  }

  async escalateTicket(ticketId: number, escalateTo: number | null, reason: string, actorId: number) {
    return helpdeskEnterpriseRepository.escalateTicket(ticketId, escalateTo, reason, actorId);
  }

  async reopenTicket(ticketId: number, reason: string, requesterId: number) {
    return helpdeskEnterpriseRepository.reopenTicket(ticketId, reason, requesterId);
  }

  async addComment(ticketId: number, authorId: number, text: string, isInternal: boolean, userRole: string) {
    return helpdeskEnterpriseRepository.addComment(ticketId, authorId, text, isInternal, userRole);
  }

  async getComments(ticketId: number, userRole: string) {
    return helpdeskEnterpriseRepository.getComments(ticketId, userRole);
  }

  async addWatcher(ticketId: number, employeeId: number, addedBy: number) {
    return helpdeskEnterpriseRepository.addWatcher(ticketId, employeeId, addedBy);
  }

  async removeWatcher(ticketId: number, employeeId: number) {
    return helpdeskEnterpriseRepository.removeWatcher(ticketId, employeeId);
  }

  async addTag(ticketId: number, tagName: string) {
    return helpdeskEnterpriseRepository.addTag(ticketId, tagName);
  }

  async removeTag(ticketId: number, tagName: string) {
    return helpdeskEnterpriseRepository.removeTag(ticketId, tagName);
  }

  async rateSatisfaction(ticketId: number, employeeId: number, rating: number, feedback: string) {
    return helpdeskEnterpriseRepository.rateSatisfaction(ticketId, employeeId, rating, feedback);
  }

  async createArticle(title: string, content: string, categoryId: number | null, tags: string, createdBy: number) {
    return helpdeskEnterpriseRepository.createArticle(title, content, categoryId, tags, createdBy);
  }

  async getArticles(search?: string) {
    return helpdeskEnterpriseRepository.getArticles(search);
  }

  async viewArticle(articleId: number) {
    return helpdeskEnterpriseRepository.viewArticle(articleId);
  }

  async createCannedResponse(title: string, responseText: string, category: string, shortcutCode: string, createdBy: number) {
    return helpdeskEnterpriseRepository.createCannedResponse(title, responseText, category, shortcutCode, createdBy);
  }

  async getCannedResponses(category?: string) {
    return helpdeskEnterpriseRepository.getCannedResponses(category);
  }

  async useCannedResponse(responseId: number) {
    return helpdeskEnterpriseRepository.useCannedResponse(responseId);
  }

  async getCategories() {
    return helpdeskEnterpriseRepository.getCategories();
  }

  async createCategory(name: string, code: string, description: string, departmentId: number | null, defaultAssigneeId: number | null) {
    return helpdeskEnterpriseRepository.createCategory(name, code, description, departmentId, defaultAssigneeId);
  }

  async getSLARules() {
    return helpdeskEnterpriseRepository.getSLARules();
  }

  async createSLARule(category: string, priority: string, resolutionHours: number) {
    return helpdeskEnterpriseRepository.createSLARule(category, priority, resolutionHours);
  }

  async getEscalationRules() {
    return helpdeskEnterpriseRepository.getEscalationRules();
  }

  async createEscalationRule(categoryId: number, priority: string, hours: number, role: string, empId: number | null) {
    return helpdeskEnterpriseRepository.createEscalationRule(categoryId, priority, hours, role, empId);
  }

  async getAnalytics() {
    return helpdeskEnterpriseRepository.getAnalytics();
  }

  async bulkAssign(ticketIds: number[], agentId: number, assignerId: number) {
    return helpdeskEnterpriseRepository.bulkAssign(ticketIds, agentId, assignerId);
  }

  async bulkClose(ticketIds: number[], reason: string, actorId: number) {
    return helpdeskEnterpriseRepository.bulkClose(ticketIds, reason, actorId);
  }

  async getMyTickets(employeeId: number) {
    return helpdeskEnterpriseRepository.getMyTickets(employeeId);
  }

  async getAgentQueue(agentId: number) {
    return helpdeskEnterpriseRepository.getAgentQueue(agentId);
  }

  async seedCategories() {
    return helpdeskEnterpriseRepository.seedCategories();
  }
}

export const helpdeskEnterpriseService = new HelpdeskEnterpriseService();
