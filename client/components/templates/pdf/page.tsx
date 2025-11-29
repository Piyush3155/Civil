import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 10,
    borderBottom: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    width: "40%",
    fontWeight: "bold",
    color: "#475569",
  },
  value: {
    width: "60%",
    color: "#1e293b",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 8,
    fontWeight: "bold",
    borderBottom: 1,
    borderBottomColor: "#cbd5e1",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottom: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableCell: {
    flex: 1,
  },
  kpiCard: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
    borderLeft: 3,
    borderLeftColor: "#2563eb",
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 3,
  },
  kpiLabel: {
    fontSize: 9,
    color: "#64748b",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 8,
    borderTop: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  gridItem: {
    width: "48%",
    marginRight: "2%",
    marginBottom: 10,
  },
});

interface ProjectOverviewData {
  project: {
    name: string;
    code: string;
    status: string;
    startDate?: string;
    endDate?: string;
    location?: string;
  };
  overview: {
    overallProgress: number;
    tasks: {
      total: number;
      completed: number;
      inProgress: number;
      pending: number;
    };
    materials: {
      totalConsumed: number;
    };
    procurement: {
      pendingPOs: number;
      totalPOs: number;
    };
    qc: {
      openIssues: number;
      totalIssues: number;
    };
    billing: {
      totalBills: number;
      totalAmount: number;
      paidAmount: number;
      pendingAmount: number;
    };
    labour: {
      todayCount: number;
    };
  };
}

interface ProgressData {
  progressTimeline: Array<{
    date: string;
    progress: number;
  }>;
  wbsProgress: Array<{
    title: string;
    status: string;
    progress: number;
  }>;
  summary: {
    totalTasks: number;
    completedTasks: number;
    averageProgress: number;
  };
}

interface PDFTemplateProps {
  data: {
    overview?: ProjectOverviewData;
    progress?: ProgressData;
    materials?: string;
    procurement?: string;
    billing?: string;
  };
  reportType: "daily" | "weekly" | "monthly" | "overview" | "progress" | "materials" | "procurement" | "billing" | "complete";
}

const AnalyticsReportPDF: React.FC<PDFTemplateProps> = ({ data, reportType }) => {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Debug: Log data to console
  console.log("PDF Template Data:", data);
  console.log("Report Type:", reportType);

  const projectName = data.overview?.project?.name || "Project Not Found";
  const projectCode = data.overview?.project?.code || "N/A";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Construction Analytics Report</Text>
          <Text style={styles.subtitle}>
            {projectName} ({projectCode})
          </Text>
          <Text style={styles.subtitle}>Generated: {currentDate}</Text>
          <Text style={styles.subtitle}>Report Type: {reportType.toUpperCase()}</Text>
        </View>

        {/* Show message if no data */}
        {!data.overview && !data.progress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>No Data Available</Text>
            <Text>Unable to fetch analytics data for this project. Please try again.</Text>
          </View>
        )}

        {/* Project Overview Section */}
        {data.overview && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Project Information</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Project Name:</Text>
                <Text style={styles.value}>{data.overview.project?.name || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Project Code:</Text>
                <Text style={styles.value}>{data.overview.project?.code || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Status:</Text>
                <Text style={styles.value}>{data.overview.project?.status || "N/A"}</Text>
              </View>
              {data.overview.project?.location && (
                <View style={styles.row}>
                  <Text style={styles.label}>Location:</Text>
                  <Text style={styles.value}>{data.overview.project.location}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Overall Progress:</Text>
                <Text style={styles.value}>{data.overview.overview?.overallProgress || 0}%</Text>
              </View>
            </View>

            {/* KPI Summary */}
            {data.overview.overview && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
                <View style={styles.gridContainer}>
                  <View style={[styles.gridItem, styles.kpiCard]}>
                    <Text style={styles.kpiValue}>
                      {data.overview.overview.tasks?.completed || 0}/{data.overview.overview.tasks?.total || 0}
                    </Text>
                    <Text style={styles.kpiLabel}>Tasks Completed</Text>
                  </View>
                  <View style={[styles.gridItem, styles.kpiCard]}>
                    <Text style={styles.kpiValue}>{data.overview.overview.labour?.todayCount || 0}</Text>
                    <Text style={styles.kpiLabel}>Labour Today</Text>
                  </View>
                  <View style={[styles.gridItem, styles.kpiCard]}>
                    <Text style={styles.kpiValue}>
                      {data.overview.overview.procurement?.pendingPOs || 0}/{data.overview.overview.procurement?.totalPOs || 0}
                    </Text>
                    <Text style={styles.kpiLabel}>Pending Purchase Orders</Text>
                  </View>
                  <View style={[styles.gridItem, styles.kpiCard]}>
                    <Text style={styles.kpiValue}>
                      {data.overview.overview.qc?.openIssues || 0}/{data.overview.overview.qc?.totalIssues || 0}
                    </Text>
                    <Text style={styles.kpiLabel}>Open QC Issues</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Billing Summary */}
            {data.overview.overview?.billing && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Billing Summary</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Total Bills:</Text>
                  <Text style={styles.value}>{data.overview.overview.billing.totalBills || 0}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Total Amount:</Text>
                  <Text style={styles.value}>₹{(data.overview.overview.billing.totalAmount || 0).toLocaleString("en-IN")}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Paid Amount:</Text>
                  <Text style={styles.value}>₹{(data.overview.overview.billing.paidAmount || 0).toLocaleString("en-IN")}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Pending Amount:</Text>
                  <Text style={styles.value}>₹{(data.overview.overview.billing.pendingAmount || 0).toLocaleString("en-IN")}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Progress Section */}
        {data.progress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress Summary</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Total Tasks:</Text>
              <Text style={styles.value}>{data.progress.summary?.totalTasks || 0}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Completed Tasks:</Text>
              <Text style={styles.value}>{data.progress.summary?.completedTasks || 0}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Average Progress:</Text>
              <Text style={styles.value}>{(data.progress.summary?.averageProgress || 0).toFixed(2)}%</Text>
            </View>

            {/* WBS Progress Table */}
            {data.progress.wbsProgress && data.progress.wbsProgress.length > 0 && (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Task</Text>
                  <Text style={styles.tableCell}>Status</Text>
                  <Text style={styles.tableCell}>Progress</Text>
                </View>
                {data.progress.wbsProgress.slice(0, 10).map((task, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{task.title || "Untitled Task"}</Text>
                    <Text style={styles.tableCell}>{task.status || "N/A"}</Text>
                    <Text style={styles.tableCell}>{task.progress || 0}%</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Construction Project Management System - Analytics Report</Text>
          <Text>Generated on {currentDate}</Text>
        </View>
      </Page>
    </Document>
  );
};

export { AnalyticsReportPDF };
export default AnalyticsReportPDF;
