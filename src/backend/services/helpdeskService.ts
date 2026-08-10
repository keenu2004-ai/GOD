import { helpdeskRepository, TicketDTO } from '../repositories/helpdeskRepository.js';
import { notificationEngineService as notificationService } from './notificationEngineService.js';
import db from '../database/db.js';

class HelpdeskService {
  async createTicket(dto: TicketDTO, requesterId: number) {
    dto.requester_id = requesterId;
    
    // Generate a unique ticket number TKT-YYYYMMDD-XXXX
    const res = await db.query(`SELECT COUNT(*) + 1 as next_val FROM helpdesk_tickets`);
    const nextVal = res.rows[0].next_val;
    const ticketNumber = `TKT-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${String(nextVal).padStart(4, '0')}`;
    
    const ticket = await helpdeskRepository.createTicket(ticketNumber, dto);
    await helpdeskRepository.logHistory(ticket.id, requesterId, 'CREATED');
    
    // Notify Admins
    await notificationService.dispatchNotification({
      recipient_id: 1, // System Admin
      type: 'TICKET_CREATED',
      title: 'New Helpdesk Ticket',
      message: `Ticket ${ticketNumber} created by Employee #${requesterId}.`,
      priority: 'MEDIUM'
    });

    return ticket;
  }

  async getAllTickets(userRole: string, userId: number) {
    const filters: any = {};
    if (userRole === 'EMPLOYEE') {
      filters.requester_id = userId;
    }
    return helpdeskRepository.getAllTickets(filters);
  }

  async getTicketById(id: number) {
    return helpdeskRepository.getTicketById(id);
  }

  async updateStatus(id: number, status: string, actorId: number) {
    const ticket = await helpdeskRepository.getTicketById(id);
    if (!ticket) throw new Error('Ticket not found');
    
    const updated = await helpdeskRepository.updateStatus(id, status);
    await helpdeskRepository.logHistory(id, actorId, 'STATUS_CHANGED', ticket.status, status);
    
    // Notify Requester
    await notificationService.dispatchNotification({
      recipient_id: ticket.requester_id,
      type: 'TICKET_UPDATED',
      title: `Ticket ${ticket.ticket_number} Update`,
      message: `Your ticket status changed to ${status}`,
      priority: 'MEDIUM'
    });

    return updated;
  }

  async assignTicket(id: number, assigneeId: number, actorId: number) {
    const ticket = await helpdeskRepository.getTicketById(id);
    if (!ticket) throw new Error('Ticket not found');
    
    const updated = await helpdeskRepository.assignTicket(id, assigneeId);
    await helpdeskRepository.logHistory(id, actorId, 'ASSIGNED', String(ticket.assigned_to), String(assigneeId));
    
    // Notify Assignee
    await notificationService.dispatchNotification({
      recipient_id: assigneeId,
      type: 'TICKET_ASSIGNED',
      title: `Ticket Assigned: ${ticket.ticket_number}`,
      message: `You have been assigned a ticket.`,
      priority: 'HIGH'
    });

    return updated;
  }

  async addComment(ticketId: number, authorId: number, comment: string, isInternal: boolean) {
    const ticket = await helpdeskRepository.getTicketById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    
    const newComment = await helpdeskRepository.addComment(ticketId, authorId, comment, isInternal);
    await helpdeskRepository.logHistory(ticketId, authorId, 'COMMENT_ADDED');
    
    return newComment;
  }

  async getComments(ticketId: number) {
    return helpdeskRepository.getComments(ticketId);
  }
}

export const helpdeskService = new HelpdeskService();
