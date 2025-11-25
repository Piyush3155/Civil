"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ContractorBill } from "@/types/billing"

interface BillManagementProps {
  projectId: string
  userRole: string
}

export function BillManagement({ projectId, userRole }: BillManagementProps) {
  const [bills, setBills] = useState<ContractorBill[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchBills = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/billing/bill?projectId=${projectId}`)
        const data = await res.json()
        if (isMounted) {
          setBills(data)
        }
      } catch (error) {
        console.error("Error fetching bills:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchBills()

    return () => {
      isMounted = false
    }
  }, [projectId])

  const refetchBills = async () => {
    try {
      const res = await fetch(`/api/billing/bill?projectId=${projectId}`)
      const data = await res.json()
      setBills(data)
    } catch (error) {
      console.error("Error refetching bills:", error)
    }
  }

  const submitBill = async (billId: string) => {
    try {
      await fetch(`/api/billing/bill/${billId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SUBMITTED" }),
      })
      refetchBills()
    } catch (error) {
      console.error("Error submitting bill:", error)
    }
  }

  const approveBill = async (billId: string) => {
    try {
      await fetch(`/api/billing/bill/${billId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", approvedBy: "current-user-id" }),
      })
      refetchBills()
    } catch (error) {
      console.error("Error approving bill:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "secondary"
      case "SUBMITTED":
        return "default"
      case "VERIFIED":
        return "outline"
      case "APPROVED":
        return "default"
      case "PAID":
        return "default"
      case "REJECTED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getRoleActions = (bill: ContractorBill) => {
    if (userRole === "contractor" && bill.status === "DRAFT") {
      return { label: "Submit", action: () => submitBill(bill.id) }
    }
    if (userRole === "engineer" && bill.status === "SUBMITTED") {
      return { label: "Verify", action: () => approveBill(bill.id) }
    }
    if (userRole === "pm" && bill.status === "VERIFIED") {
      return { label: "Approve", action: () => approveBill(bill.id) }
    }
    return null
  }

  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      <Card className="border-0 shadow-sm md:shadow">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-transparent pb-4">
          <CardTitle className="text-lg md:text-xl">Contractor Bills</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Role: <span className="font-medium capitalize">{userRole}</span> • {bills.length} bills total
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading bills...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No bills found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="text-sm font-semibold">Bill Number</TableHead>
                    <TableHead className="text-sm font-semibold hidden md:table-cell">Contractor</TableHead>
                    <TableHead className="text-sm font-semibold hidden lg:table-cell">Period</TableHead>
                    <TableHead className="text-sm font-semibold">Amount</TableHead>
                    <TableHead className="text-sm font-semibold">Status</TableHead>
                    <TableHead className="text-sm font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => {
                    const action = getRoleActions(bill)
                    return (
                      <TableRow key={bill.id} className="border-b hover:bg-muted/50">
                        <TableCell className="text-sm font-medium">{bill.billNumber}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{bill.contractor.name}</TableCell>
                        <TableCell className="text-sm hidden lg:table-cell text-muted-foreground">
                          {new Date(bill.periodFrom).toLocaleDateString()} -{" "}
                          {new Date(bill.periodTo).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm font-semibold">₹{bill.totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-sm">
                          <Badge variant={getStatusColor(bill.status)} className="text-xs">
                            {bill.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {action ? (
                            <Button onClick={action.action} size="sm" className="text-xs">
                              {action.label}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
