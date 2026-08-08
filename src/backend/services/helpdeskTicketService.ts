import {
  helpdeskTicketRepository, CreateTicketDTO
} from '../repositories/helpdeskTicketRepository.js';

export class HelpdeskTicketService {
  async createTicket(dto: CreateTicketDTO, requesterId: number) {
    return helpdeskTicketRepository.createTicket(dto, requesterId);
  }

  async getTickets() {
    return helpdeskTicketRepository.getTickets();
  }

  async assignTicket(ticketId: number, agentId: number, assignerId: number) {
    return helpdeskTicketRepository.assignTicket(ticketId, agentId, assignerId);
  }

  async resolveTicket(ticketId: number, notes: string, resolverId: number) {
    return helpdeskTicketRepository.resolveTicket(ticketId, notes, resolverId);
  }

  async addComment(ticketId: number, authorId: number, text: string, isInternal: boolean, userRole: string) {
    return helpdeskTicketRepository.addComment(ticketId, authorId, text, isInternal, userRole);
  }

  async getComments(ticketId: number, requesterId: number, userRole: string) {
    return helpdeskTicketRepository.getComments(ticketId, requesterId, userRole);
  }
}

export const helpdeskTicketService = new HelpdeskTicketService();
