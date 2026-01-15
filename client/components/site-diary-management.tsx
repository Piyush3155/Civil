"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle, Calendar, MapPin, CloudRain, AlertCircle } from 'lucide-react';
import { createDiary, fetchDiariesByProject, addLabourLog, addMaterialLog, addEquipmentLog, approveDiary } from "@/app/actions/site-diary/main";
import { fetchMaterials } from "@/app/actions/materials/main";
import { fetchContractors } from "@/app/actions/contractors/main";
import Loader from "./ui/loader";

interface Contractor {
  id: string;
  name: string;
}

interface Labour {
  id: string;
  name: string;
}

interface Material {
  id: string;
  name: string;
}

interface LabourLog {
  id: string;
  contractor?: Contractor;
  labour?: Labour;
  count: number;
  workDone?: string;
}

interface MaterialLog {
  id: string;
  material?: Material;
  quantityUsed: number;
  notes?: string;
}

interface EquipmentLog {
  id: string;
  equipmentName: string;
  hoursUsed: number;
  operatorName?: string;
  notes?: string;
}

interface SiteDiary {
  id: string;
  date: string;
  weather?: string;
  location?: string;
  notes?: string;
  issues?: string;
  status: string;
  labourLogs?: LabourLog[];
  materialLogs?: MaterialLog[];
  equipmentLogs?: EquipmentLog[];
}

interface SiteDiaryManagementProps {
  projectId: string;
}

export default function SiteDiaryManagement({ projectId }: SiteDiaryManagementProps) {
  const [diaries, setDiaries] = useState<SiteDiary[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<SiteDiary | null>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logType, setLogType] = useState<'labour' | 'material' | 'equipment'>('labour');

  // Form states
  const [diaryForm, setDiaryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weather: '',
    location: '',
    notes: '',
    issues: '',
    photos: [] as string[],
  });

  const [labourForm, setLabourForm] = useState({
    contractorId: '',
    labourId: '',
    count: 0,
    workDone: '',
  });

  const [materialForm, setMaterialForm] = useState({
    materialId: '',
    quantityUsed: 0,
    notes: '',
  });

  const [equipmentForm, setEquipmentForm] = useState({
    equipmentName: '',
    hoursUsed: 0,
    operatorName: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [diariesData, materialsData, contractorsData] = await Promise.all([
        fetchDiariesByProject(projectId),
        fetchMaterials(),
        fetchContractors(),
      ]);
      setDiaries(diariesData);
      setMaterials(materialsData);
      setContractors(contractorsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateDiary = async () => {
    try {
      await createDiary(projectId, diaryForm);
      setCreateDialogOpen(false);
      setDiaryForm({
        date: new Date().toISOString().split('T')[0],
        weather: '',
        location: '',
        notes: '',
        issues: '',
        photos: [],
      });
      loadData();
    } catch (error) {
      console.error('Error creating diary:', error);
    }
  };

  const handleAddLabourLog = async () => {
    if (!selectedDiary) return;
    try {
      await addLabourLog(selectedDiary.id, labourForm);
      setLogDialogOpen(false);
      setLabourForm({
        contractorId: '',
        labourId: '',
        count: 0,
        workDone: '',
      });
      loadData();
    } catch (error) {
      console.error('Error adding labour log:', error);
    }
  };

  const handleAddMaterialLog = async () => {
    if (!selectedDiary) return;
    try {
      await addMaterialLog(selectedDiary.id, materialForm);
      setLogDialogOpen(false);
      setMaterialForm({
        materialId: '',
        quantityUsed: 0,
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Error adding material log:', error);
    }
  };

  const handleAddEquipmentLog = async () => {
    if (!selectedDiary) return;
    try {
      await addEquipmentLog(selectedDiary.id, equipmentForm);
      setLogDialogOpen(false);
      setEquipmentForm({
        equipmentName: '',
        hoursUsed: 0,
        operatorName: '',
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Error adding equipment log:', error);
    }
  };

  const handleApproveDiary = async (diaryId: string) => {
    try {
      await approveDiary(diaryId);
      loadData();
    } catch (error) {
      console.error('Error approving diary:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        {/* <div>
          <h2 className="text-xl font-bold">Site Diaries</h2>
          <p className="text-sm text-muted-foreground mt-1">Track daily activities, labor, materials, and equipment</p>
        </div> */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create Diary
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Site Diary</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={diaryForm.date}
                  onChange={(e) => setDiaryForm({ ...diaryForm, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="weather">Weather</Label>
                <Input
                  id="weather"
                  value={diaryForm.weather}
                  onChange={(e) => setDiaryForm({ ...diaryForm, weather: e.target.value })}
                  placeholder="e.g., Sunny, Rainy, Cloudy"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={diaryForm.location}
                  onChange={(e) => setDiaryForm({ ...diaryForm, location: e.target.value })}
                  placeholder="e.g., Footing Area, Block A Level 1"
                />
              </div>
              <div>
                <Label htmlFor="notes">Work Notes</Label>
                <Textarea
                  id="notes"
                  value={diaryForm.notes}
                  onChange={(e) => setDiaryForm({ ...diaryForm, notes: e.target.value })}
                  placeholder="Describe work completed today..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="issues">Issues & Safety Notes</Label>
                <Textarea
                  id="issues"
                  value={diaryForm.issues}
                  onChange={(e) => setDiaryForm({ ...diaryForm, issues: e.target.value })}
                  placeholder="Any issues, delays, or safety concerns..."
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateDiary} className="w-full">
                Create Diary
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Diaries Grid */}
      <div className="space-y-4">
        {diaries.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-muted-foreground">No site diaries yet. Create one to get started.</p>
          </Card>
        ) : (
          diaries.map((diary) => (
            <Card key={diary.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <CardTitle className="text-lg">
                        {new Date(diary.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </CardTitle>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CloudRain className="w-4 h-4" />
                        <span>{diary.weather || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{diary.location || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:items-end gap-2">
                    <Badge variant={diary.status === 'APPROVED' ? 'default' : 'secondary'} className="w-fit">
                      {diary.status}
                    </Badge>
                    {diary.status !== 'APPROVED' && (
                      <Button size="sm" onClick={() => handleApproveDiary(diary.id)} className="w-full md:w-auto">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Notes Section */}
                {diary.notes && (
                  <div className="pb-6 border-b">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      Work Notes
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{diary.notes}</p>
                  </div>
                )}

                {/* Issues Section */}
                {diary.issues && (
                  <div className="pb-6 border-b bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                    <h4 className="font-semibold text-sm md:text-xs mb-2 flex items-center gap-2 text-red-700 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      Issues & Safety Notes
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-300 leading-relaxed">{diary.issues}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-4">
                  <Dialog open={logDialogOpen && selectedDiary?.id === diary.id && logType === 'labour'} 
                    onOpenChange={(open) => {
                      setLogDialogOpen(open);
                      if (open) {
                        setSelectedDiary(diary);
                        setLogType('labour');
                      }
                    }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setSelectedDiary(diary);
                          setLogType('labour');
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Labour
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Labour Log</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="contractor">Contractor</Label>
                          <Select value={labourForm.contractorId} onValueChange={(value) => setLabourForm({ ...labourForm, contractorId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contractor" />
                            </SelectTrigger>
                            <SelectContent>
                              {contractors.map((contractor) => (
                                <SelectItem key={contractor.id} value={contractor.id}>
                                  {contractor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="count">Count</Label>
                          <Input
                            id="count"
                            type="number"
                            value={labourForm.count}
                            onChange={(e) => setLabourForm({ ...labourForm, count: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="workDone">Work Done</Label>
                          <Textarea
                            id="workDone"
                            value={labourForm.workDone}
                            onChange={(e) => setLabourForm({ ...labourForm, workDone: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <Button onClick={handleAddLabourLog} className="w-full">
                          Add Labour Log
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                
                  <Dialog open={logDialogOpen && selectedDiary?.id === diary.id && logType === 'material'} 
                    onOpenChange={(open) => {
                      setLogDialogOpen(open);
                      if (open) {
                        setSelectedDiary(diary);
                        setLogType('material');
                      }
                    }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setSelectedDiary(diary);
                          setLogType('material');
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Material
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Material Log</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="material">Material</Label>
                          <Select value={materialForm.materialId} onValueChange={(value) => setMaterialForm({ ...materialForm, materialId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map((material) => (
                                <SelectItem key={material.id} value={material.id}>
                                  {material.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="quantity">Quantity Used</Label>
                          <Input
                            id="quantity"
                            type="number"
                            step="0.01"
                            value={materialForm.quantityUsed}
                            onChange={(e) => setMaterialForm({ ...materialForm, quantityUsed: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="matNotes">Notes</Label>
                          <Textarea
                            id="matNotes"
                            value={materialForm.notes}
                            onChange={(e) => setMaterialForm({ ...materialForm, notes: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <Button onClick={handleAddMaterialLog} className="w-full">
                          Add Material Log
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={logDialogOpen && selectedDiary?.id === diary.id && logType === 'equipment'} 
                    onOpenChange={(open) => {
                      setLogDialogOpen(open);
                      if (open) {
                        setSelectedDiary(diary);
                        setLogType('equipment');
                      }
                    }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setSelectedDiary(diary);
                          setLogType('equipment');
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Equipment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Equipment Log</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="equipmentName">Equipment Name</Label>
                          <Input
                            id="equipmentName"
                            value={equipmentForm.equipmentName}
                            onChange={(e) => setEquipmentForm({ ...equipmentForm, equipmentName: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="hoursUsed">Hours Used</Label>
                          <Input
                            id="hoursUsed"
                            type="number"
                            step="0.01"
                            value={equipmentForm.hoursUsed}
                            onChange={(e) => setEquipmentForm({ ...equipmentForm, hoursUsed: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="operatorName">Operator Name</Label>
                          <Input
                            id="operatorName"
                            value={equipmentForm.operatorName}
                            onChange={(e) => setEquipmentForm({ ...equipmentForm, operatorName: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="eqNotes">Notes</Label>
                          <Textarea
                            id="eqNotes"
                            value={equipmentForm.notes}
                            onChange={(e) => setEquipmentForm({ ...equipmentForm, notes: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <Button onClick={handleAddEquipmentLog} className="w-full">
                          Add Equipment Log
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Labour Logs */}
                {diary.labourLogs && diary.labourLogs.length > 0 && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Labour Logs ({diary.labourLogs.length})
                    </h4>
                    <div className="space-y-3">
                      {diary.labourLogs.map((log: LabourLog) => (
                        <div key={log.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Contractor</p>
                            <p className="font-medium">{log.contractor?.name || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Labour</p>
                            <p className="font-medium">{log.labour?.name || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Count</p>
                            <p className="font-medium">{log.count}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Work Done</p>
                            <p className="font-medium text-xs line-clamp-2">{log.workDone || '-'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Material Logs */}
                {diary.materialLogs && diary.materialLogs.length > 0 && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Material Logs ({diary.materialLogs.length})
                    </h4>
                    <div className="space-y-3">
                      {diary.materialLogs.map((log: MaterialLog) => (
                        <div key={log.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Material</p>
                            <p className="font-medium">{log.material?.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Qty Used</p>
                            <p className="font-medium">{log.quantityUsed}</p>
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <p className="text-xs text-muted-foreground mb-1">Notes</p>
                            <p className="font-medium text-xs line-clamp-2">{log.notes || '-'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment Logs */}
                {diary.equipmentLogs && diary.equipmentLogs.length > 0 && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      Equipment Logs ({diary.equipmentLogs.length})
                    </h4>
                    <div className="space-y-3">
                      {diary.equipmentLogs.map((log: EquipmentLog) => (
                        <div key={log.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Equipment</p>
                            <p className="font-medium">{log.equipmentName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Hours Used</p>
                            <p className="font-medium">{log.hoursUsed}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Operator</p>
                            <p className="font-medium text-xs line-clamp-2">{log.operatorName || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Notes</p>
                            <p className="font-medium text-xs line-clamp-2">{log.notes || '-'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}