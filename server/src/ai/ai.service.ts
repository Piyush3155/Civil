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
      // Handle some basic queries directly without AI
      const lowerQuery = userQuery.toLowerCase();
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

      // Get the schema information to provide context to Gemini
      const schemaInfo = await this.getSchemaInfo();

      // Create the prompt for Gemini
      const prompt = `
You are an AI assistant that converts natural language queries about a civil construction project management database into SQL queries.

Database Schema (PostgreSQL with Prisma):
${schemaInfo}

User Query: "${userQuery}"

Instructions:
1. Generate ONLY a valid PostgreSQL SELECT query
2. Use proper table and column names from the schema
3. Include appropriate JOINs when needed
4. Limit results to 20 rows maximum unless specifically asked for more
5. Use clear column aliases
6. Handle dates properly
7. Return ONLY the SQL query, no explanations

If the query cannot be converted to SQL, return: SELECT 'I cannot process this query. Please ask about projects, tasks, materials, equipment, contractors, or QC issues.' as message;
`;

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const sqlQuery = response.text().trim();

      if (!sqlQuery) {
        return { error: 'Unable to convert query to SQL' };
      }

      // Execute the SQL query
      let resultSet;
      try {
        resultSet = await this.prisma.$queryRawUnsafe(sqlQuery);
      } catch (sqlError) {
        console.error('SQL execution error:', sqlError);
        return {
          query: sqlQuery,
          error: 'Generated SQL query is invalid. Please try rephrasing your question.',
          sqlError: sqlError.message
        };
      }

      const formattedResults = this.formatResults(resultSet);

      return {
        query: sqlQuery,
        results: formattedResults,
      };
    } catch (error) {
      console.error('Error processing AI query:', error);
      return {
        error: 'AI service is currently unavailable. Please try again later or contact support.',
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
        if (key.toLowerCase() === 'name' || key.toLowerCase() === 'title' || value === null || value === undefined) {
          return; // Skip title fields or empty values
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
