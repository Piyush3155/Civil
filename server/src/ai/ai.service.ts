import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private prisma: PrismaClient;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.prisma = new PrismaClient();
  }

  async processQuery(userQuery: string): Promise<any> {
    try {
      const lowerQuery = userQuery.toLowerCase();
      
      // Handle project-related questions
      if (lowerQuery.includes('which project') || lowerQuery.includes('what project') || 
          lowerQuery.includes('project details') || lowerQuery.includes('show project')) {
        try {
          const projects = await this.prisma.project.findMany({
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              name: true,
              code: true,
              location: true,
              progress: true,
              status: true
            },
            take: 10
          });
          
          if (projects.length === 1) {
            // If only one active project, show its details
            const project = projects[0];
            return {
              query: `SELECT id, name, code, location, progress, status FROM Project WHERE id = '${project.id}'`,
              results: `**${project.name}** (${project.code})\n\n- Location: ${project.location}\n- Progress: ${project.progress}%\n- Status: ${project.status}`,
              directQuery: true
            };
          } else {
            // Multiple projects, show list
            return {
              query: 'SELECT id, name, code, location, progress, status FROM Project WHERE status = \'ACTIVE\' LIMIT 10',
              results: this.formatResults(projects),
              directQuery: true
            };
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          return {
            error: 'Unable to fetch project information.',
            directQuery: true
          };
        }
      }
      if (lowerQuery.includes('active projects') || lowerQuery.includes('projects')) {
        try {
          const projects = await this.prisma.project.findMany({
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              name: true,
              code: true,
              progress: true,
              status: true,
              location: true,
              startDate: true,
              endDate: true
            },
            take: 10
          });
          return {
            query: 'SELECT id, name, code, progress, status, location, startDate, endDate FROM Project WHERE status = \'ACTIVE\' LIMIT 10',
            results: this.formatResults(projects),
            directQuery: true
          };
        } catch (dbError) {
          console.error('Database error:', dbError);
        }
      }

      // Handle purchase orders (direct query, not project-specific)
      if (lowerQuery.includes('purchase') || lowerQuery.includes('order')) {
        try {
          const purchaseOrders = await this.prisma.purchaseOrder.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
              project: {
                select: { name: true, code: true }
              },
              supplier: {
                select: { name: true }
              }
            }
          });
          
          // Transform the data to flatten supplier and project info
          const formattedOrders = purchaseOrders.map(order => ({
            id: order.id,
            poNumber: order.poNumber,
            supplierName: order.supplier?.name || 'Unknown Supplier',
            projectName: order.project?.name || 'Unknown Project',
            projectCode: order.project?.code || '',
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt
          }));
          
          return {
            query: 'SELECT po.id, po.poNumber, s.name as supplierName, p.name as projectName, p.code as projectCode, po.totalAmount, po.status, po.createdAt FROM PurchaseOrder po JOIN Supplier s ON po.supplierId = s.id JOIN Project p ON po.projectId = p.id ORDER BY po.createdAt DESC LIMIT 20',
            results: this.formatResults(formattedOrders),
            directQuery: true
          };
        } catch (dbError) {
          console.error('Database error:', dbError);
          return {
            error: 'Unable to fetch purchase order information.',
            directQuery: true
          };
        }
      }

      // Handle queries that need project selection
      if (lowerQuery.includes('task') || lowerQuery.includes('material') || 
          lowerQuery.includes('equipment') || lowerQuery.includes('contractor') || 
          lowerQuery.includes('qc') || lowerQuery.includes('quality') || 
          lowerQuery.includes('inventory') || lowerQuery.includes('stock')) {
        
        // Check if user is referring to "this project" or "the project" and there's only one active project
        const refersToCurrentProject = lowerQuery.includes('this project') || 
                                      lowerQuery.includes('the project') || 
                                      lowerQuery.includes('that project');
        
        if (refersToCurrentProject) {
          try {
            const projects = await this.prisma.project.findMany({
              where: { status: 'ACTIVE' },
              select: { id: true, name: true, code: true },
              take: 10
            });

            if (projects.length === 1) {
              // Automatically fetch data for the single active project
              const selectedProject = projects[0];
              const queryType = this.getQueryType(lowerQuery);
              const result = await this.getProjectData(selectedProject.id, queryType);
              
              return {
                results: `**${selectedProject.name}** (${selectedProject.code})\n\n${result.results}`,
                directQuery: true
              };
            }
          } catch (dbError) {
            console.error('Database error:', dbError);
            return {
              error: 'Unable to fetch project information.',
              directQuery: true
            };
          }
        }
        
        try {
          const projects = await this.prisma.project.findMany({
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              name: true,
              code: true,
              location: true
            },
            take: 10
          });

          if (projects.length === 0) {
            return {
              results: 'No active projects found. Please create a project first.',
              directQuery: true
            };
          }

          let response = `I found ${projects.length} active project(s). Please select a project to get the ${this.getQueryType(lowerQuery)} information:\n\n`;
          
          projects.forEach((project, index) => {
            response += `${index + 1}. **${project.name}** (${project.code})\n`;
            response += `   Location: ${project.location}\n`;
            response += `   Project ID: ${project.id}\n\n`;
          });

          response += `Reply with the project number (1-${projects.length}) to get the ${this.getQueryType(lowerQuery)} data for that project.`;

          return {
            results: response,
            projects: projects,
            queryType: this.getQueryType(lowerQuery),
            directQuery: true,
            needsProjectSelection: true
          };
        } catch (dbError) {
          console.error('Database error:', dbError);
          return {
            error: 'Unable to fetch project information.',
            directQuery: true
          };
        }
      }
      // Handle simple number inputs (potential project selections)
      if (/^\d+$/.test(userQuery.trim()) && userQuery.trim().length <= 2) {
        const projectIndex = parseInt(userQuery.trim()) - 1; // Convert to 0-based index
        
        try {
          const projects = await this.prisma.project.findMany({
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              name: true,
              code: true,
              location: true
            },
            take: 10
          });

          if (projectIndex >= 0 && projectIndex < projects.length) {
            const selectedProject = projects[projectIndex];
            // Default to showing tasks for the selected project
            const tasks = await this.prisma.task.findMany({
              where: { projectId: selectedProject.id },
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                category: true,
                startDate: true,
                endDate: true,
                weightage: true
              },
              take: 20
            });
            
            return {
              query: `SELECT id, title, description, status, category, startDate, endDate, weightage FROM Task WHERE projectId = '${selectedProject.id}' LIMIT 20`,
              results: `Selected project: **${selectedProject.name}** (${selectedProject.code})\n\n${this.formatResults(tasks)}`,
              directQuery: true
            };
          } else {
            return {
              results: `Project number ${projectIndex + 1} not found. Please select a valid project number (1-${projects.length}).`,
              directQuery: true
            };
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          return {
            error: 'Unable to process project selection.',
            directQuery: true
          };
        }
      }

      // For unrecognized queries, provide helpful guidance
      return {
        results: 'I can help you with:\n\n• "Active projects?" - View all active projects\n• "Which project?" - Show current project details\n• "Task status?" - View tasks for a specific project\n• "Low stock materials?" - Check material inventory\n• "Equipment in use?" - View equipment status\n• "Purchase orders?" - View recent purchase orders\n\nTry asking about projects, tasks, materials, equipment, or purchase orders!',
        directQuery: true
      };
    }
    catch (error) {
      console.error('Error processing AI query:', error);
      return {
        error: 'An error occurred while processing your request. Please try again.',
        details: error.message
      };
    }
  }

  private formatResults(results: any): string {
    if (!Array.isArray(results) || results.length === 0) {
      return 'No results found for your query.';
    }

    // Check for a single-value message (e.g., from a failed query)
    if (results.length === 1 && results[0].message) {
      return results[0].message;
    }

    let output = `I found ${results.length} record(s):\n\n`;

    results.forEach((row, index) => {
      const title = row.name || row.title || `Record ${index + 1}`;
      output += `**${title}**\n`;

      Object.entries(row).forEach(([key, value]) => {
        if (key.toLowerCase() === 'name' || key.toLowerCase() === 'title' || 
            key.toLowerCase() === 'id' || key.toLowerCase().includes('id') || 
            value === null || value === undefined) {
          return; // Skip title fields, ID fields, or empty values
        }

        // Capitalize the key and format the value
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
        let formattedValue = value;

        if (value instanceof Date) {
          formattedValue = value.toLocaleDateString();
        } else if (typeof value === 'object') {
          formattedValue = JSON.stringify(value);
        } else if (key.toLowerCase().includes('progress') && typeof value === 'number') {
            formattedValue = `${value}%`;
        } else if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('cost')) {
            formattedValue = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value));
        }


        output += `  - ${formattedKey}: ${formattedValue}\n`;
      });
      output += '\n';
    });

    return output;
  }

  private getQueryType(query: string): string {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('task')) return 'task';
    if (lowerQuery.includes('material')) return 'material';
    if (lowerQuery.includes('equipment')) return 'equipment';
    if (lowerQuery.includes('contractor')) return 'contractor';
    if (lowerQuery.includes('qc') || lowerQuery.includes('quality')) return 'quality control';
    if (lowerQuery.includes('inventory') || lowerQuery.includes('stock')) return 'inventory';
    return 'requested';
  }

  async getProjectData(projectId: string, queryType: string): Promise<any> {
    try {
      switch (queryType) {
        case 'task':
          const tasks = await this.prisma.task.findMany({
            where: { projectId: projectId },
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              category: true,
              startDate: true,
              endDate: true,
              weightage: true
            },
            take: 20
          });
          return {
            query: `SELECT id, title, description, status, category, startDate, endDate, weightage FROM Task WHERE projectId = '${projectId}' LIMIT 20`,
            results: this.formatResults(tasks)
          };

        case 'material':
          const materials = await this.prisma.materialStock.findMany({
            where: { projectId: projectId },
            include: {
              material: {
                select: { name: true, unit: true }
              }
            },
            take: 20
          });
          return {
            query: `SELECT ms.*, m.name, m.unit FROM MaterialStock ms JOIN Material m ON ms.materialId = m.id WHERE ms.projectId = '${projectId}' LIMIT 20`,
            results: this.formatResults(materials)
          };

        case 'equipment':
          const equipment = await this.prisma.equipment.findMany({
            where: { projectId: projectId },
            include: {
              category: {
                select: { name: true }
              }
            },
            take: 20
          });
          return {
            query: `SELECT e.*, ec.name as categoryName FROM Equipment e LEFT JOIN EquipmentCategory ec ON e.categoryId = ec.id WHERE e.projectId = '${projectId}' LIMIT 20`,
            results: this.formatResults(equipment)
          };

        case 'contractor':
          const contractors = await this.prisma.contractor.findMany({
            where: {
              projects: {
                some: { id: projectId }
              }
            },
            take: 20
          });
          return {
            query: `SELECT c.* FROM Contractor c JOIN _ContractorToProject cp ON c.id = cp.contractorId WHERE cp.projectId = '${projectId}' LIMIT 20`,
            results: this.formatResults(contractors)
          };

        case 'quality control':
          const qcIssues = await this.prisma.qCIssue.findMany({
            where: { projectId: projectId },
            select: {
              id: true,
              title: true,
              description: true,
              priority: true,
              status: true,
              type: true,
              dueDate: true
            },
            take: 20
          });
          return {
            query: `SELECT id, title, description, priority, status, type, dueDate FROM QCIssue WHERE projectId = '${projectId}' LIMIT 20`,
            results: this.formatResults(qcIssues)
          };

        default:
          return {
            error: 'Unknown query type'
          };
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
      return {
        error: `Unable to fetch ${queryType} data for this project.`
      };
    }
  }

  private async getSchemaInfo(): Promise<string> {
    // Return a simplified schema description for Civil construction
    return `
Key Tables and Fields:
- Project: id, name, code, location, progress (decimal), area, status (ACTIVE/PAUSED/COMPLETED/CANCELLED), startDate, endDate
- Task: id, projectId, title, description, category, status (PENDING/IN_PROGRESS/COMPLETED/CANCELLED), startDate, endDate, weightage, contractorId, createdBy, updatedBy
- Material: id, name, description, unit (BAG, TON, CFT, KG, PCS)
- Equipment: id, name, model, capacity, status (AVAILABLE/IN_USE/MAINTENANCE/OUT_OF_ORDER), categoryId, projectId, createdById
- Contractor: id, name, phone, type (MAIN/SUB/LABOUR_SUPPLY)
- QCIssue: id, projectId, taskId, type, title, description, priority (LOW/MEDIUM/HIGH/CRITICAL), status (OPEN/IN_PROGRESS/FIXED/CLOSED), createdBy, assignedTo, verifiedBy, closedBy, dueDate, location, costImpact
- User: id, name, username, email, phone, isAdmin, contractorId
- SiteDiary: id, projectId, date, weather, workDone, issues, createdBy, approvedBy
- PurchaseOrder: id, supplier, totalAmount, status, createdAt
- Estimate: id, projectId, totalCost, status
- Expense: id, category, amount, description, date, projectId
- MaterialStock: id, materialId, projectId, quantity, lastUpdated
- ContractorBill: id, contractorId, projectId, amount, status
- MeasurementBook: id, projectId, contractorId, totalAmount
- Drawing: id, name, type, projectId, uploadedBy
- BOQItem: id, description, quantity, unit, rate, amount, projectId
- Labour: id, name, skill, dailyRate, status, contractorId

Relationships:
- Project has many Tasks, Materials, Equipment, Contractors, QCIssues, etc.
- Tasks belong to Projects and can be assigned to Contractors
- Equipment belongs to Projects and has Categories
- QCIssues belong to Projects and Tasks, assigned to Contractors
- Users can be Contractors or Project Members
`;
  }
}

