import {
  helpdeskRepository, CreateTicketDTO, AddCommentDTO
} from '../repositories/helpdeskRepository.js';

export class HelpdeskService {
  async createTicket(dto: CreateTicketDTO, requesterId: number) {
    return helpdeskRepository.createTicket(dto, requesterId);
  }

  async getTickets(userRole: string, requesterId: number) {
    return helpdeskRepository.getTickets(userRole, requesterId);
  }

  async assignTicket(ticketId: number, agentId: number, assignerId: number) {
    return helpdeskRepository.assignTicket(ticketId, agentId, assignerId);
  }

  async updateTicketStatus(ticketId: number, status: string, resolutionNotes: string | undefined, agentId: number) {
    return helpdeskRepository.updateTicketStatus(ticketId, status, resolutionNotes, agentId);
  }

  async reopenTicket(ticketId: number, reason: string, requesterId: number) {
    return helpdeskRepository.reopenTicket(ticketId, reason, requesterId);
  }

  async addComment(dto: AddCommentDTO, authorId: number) {
    return helpdeskRepository.addComment(dto, authorId);
  }

  async getComments(ticketId: number, userRole: string) {
    return helpdeskRepository.getComments(ticketId, userRole);
  }
}

export const helpdeskService = new HelpdeskService();
