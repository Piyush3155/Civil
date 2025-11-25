"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getBOQItems } from "@/app/actions/billing/boq"
import { getMeasurements, createMeasurement } from "@/app/actions/billing/measurement"
import { getBills, updateBillStatus } from "@/app/actions/billing/bill"
import type { BOQItem, MeasurementBook, ContractorBill } from "@/types/billing"

export function ContractorBilling() {
  const [boqItems, setBoqItems] = useState<BOQItem[]>([])
  const [measurements, setMeasurements] = useState<MeasurementBook[]>([])
  const [bills, setBills] = useState<ContractorBill[]>([])
  const [selectedBOQ, setSelectedBOQ] = useState("")
  const [measuredQty, setMeasuredQty] = useState("")
  const [description, setDescription] = useState("")
  const [projectId] = useState("project-id")
  const [contractorId] = useState("contractor-id")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const refetchAll = async () => {
    if (!projectId) return
    const [boq, meas, bill] = await Promise.all([
      getBOQItems(projectId),
      getMeasurements(projectId),
      getBills(projectId),
    ])
    setBoqItems(boq)
    setMeasurements(meas)
    setBills(bill)
  }

  useEffect(() => {
    let isMounted = true

    const fetchAll = async () => {
      if (!projectId) return
      try {
        const [boq, meas, bill] = await Promise.all([
          getBOQItems(projectId),
          getMeasurements(projectId),
          getBills(projectId),
        ])
        if (!isMounted) return
        setBoqItems(boq)
        setMeasurements(meas)
        setBills(bill)
      } catch {
        // ignore errors for initial load
      }
    }

    fetchAll()
    return () => {
      isMounted = false
    }
  }, [projectId])

  const handleAddMeasurement = async () => {
    if (!selectedBOQ || !measuredQty) return
    setIsSubmitting(true)
    try {
      await createMeasurement({
        boqItemId: selectedBOQ,
        projectId,
        contractorId,
        measuredQty: Number.parseFloat(measuredQty),
        description,
        createdBy: "current-user-id",
      })
      await refetchAll()
      setSelectedBOQ("")
      setMeasuredQty("")
      setDescription("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitBill = async (billId: string) => {
    try {
      await updateBillStatus(billId, "SUBMITTED")
      await refetchAll()
    } catch (error) {
      console.error("Error submitting bill:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "secondary"
      case "SUBMITTED":
        return "default"
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

  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      {/* Add Measurement Section */}
      <Card className="border-0 shadow-sm md:shadow">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-transparent pb-4">
          <CardTitle className="text-lg md:text-xl">Add Measurement</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Record new measurements for BOQ items</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            <div>
              <Label htmlFor="boq" className="text-sm font-medium">
                BOQ Item
              </Label>
              <Select value={selectedBOQ} onValueChange={setSelectedBOQ}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select BOQ Item" />
                </SelectTrigger>
                <SelectContent>
                  {boqItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="qty" className="text-sm font-medium">
                Measured Quantity
              </Label>
              <Input
                id="qty"
                type="number"
                value={measuredQty}
                onChange={(e) => setMeasuredQty(e.target.value)}
                placeholder="Enter quantity"
                className="mt-2"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label htmlFor="desc" className="text-sm font-medium">
                Description
              </Label>
              <Input
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="mt-2"
              />
            </div>
          </div>
          <Button onClick={handleAddMeasurement} disabled={isSubmitting} className="mt-6 w-full md:w-auto">
            {isSubmitting ? "Adding..." : "Add Measurement"}
          </Button>
        </CardContent>
      </Card>

      {/* Measurements Section */}
      <Card className="border-0 shadow-sm md:shadow">
        <CardHeader className="border-b bg-gradient-to-r from-green-50 to-transparent pb-4">
          <CardTitle className="text-lg md:text-xl">My Measurements</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {measurements.filter((m) => m.contractorId === contractorId).length} measurements recorded
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="text-sm font-semibold">BOQ Item</TableHead>
                  <TableHead className="text-sm font-semibold hidden md:table-cell">Quantity</TableHead>
                  <TableHead className="text-sm font-semibold hidden lg:table-cell">Description</TableHead>
                  <TableHead className="text-sm font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {measurements.filter((m) => m.contractorId === contractorId).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No measurements recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  measurements
                    .filter((m) => m.contractorId === contractorId)
                    .map((m) => (
                      <TableRow key={m.id} className="border-b hover:bg-muted/50">
                        <TableCell className="text-sm font-medium">{m.boqItem.name}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{m.measuredQty}</TableCell>
                        <TableCell className="text-sm hidden lg:table-cell text-muted-foreground">
                          {m.description}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant={m.approvedAt ? "default" : "secondary"} className="text-xs">
                            {m.approvedAt ? "Approved" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bills Section */}
      <Card className="border-0 shadow-sm md:shadow">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-transparent pb-4">
          <CardTitle className="text-lg md:text-xl">My Bills</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {bills.filter((b) => b.contractorId === contractorId).length} total bills
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="text-sm font-semibold">Bill Number</TableHead>
                  <TableHead className="text-sm font-semibold hidden md:table-cell">Period</TableHead>
                  <TableHead className="text-sm font-semibold">Amount</TableHead>
                  <TableHead className="text-sm font-semibold">Status</TableHead>
                  <TableHead className="text-sm font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.filter((b) => b.contractorId === contractorId).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No bills available
                    </TableCell>
                  </TableRow>
                ) : (
                  bills
                    .filter((b) => b.contractorId === contractorId)
                    .map((b) => (
                      <TableRow key={b.id} className="border-b hover:bg-muted/50">
                        <TableCell className="text-sm font-medium">{b.billNumber}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell text-muted-foreground">
                          {b.periodFrom} to {b.periodTo}
                        </TableCell>
                        <TableCell className="text-sm font-semibold">₹{b.totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-sm">
                          <Badge variant={getStatusColor(b.status)} className="text-xs">
                            {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {b.status === "DRAFT" && (
                            <Button onClick={() => handleSubmitBill(b.id)} size="sm" className="text-xs">
                              Submit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
