'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getEquipmentCategories } from '@/lib/api';
import { EquipmentCategory, CreateEquipmentData } from '@/types/equipment';
import { useProject } from '@/hooks/use-project';
import { toast } from 'sonner';
import { createEquipment } from '@/app/actions/equipment/main';

interface AddEquipmentDialogProps {
  children: React.ReactNode;
}

export function AddEquipmentDialog({ children }: AddEquipmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateEquipmentData>({
    name: '',
    model: '',
    capacity: '',
    purchaseDate: '',
    purchasePrice: '',
    rental: false,
    rentalVendor: '',
    rentalRate: '',
    status: 'AVAILABLE',
    categoryId: '',
  });

  const { projectId } = useProject();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['equipment-categories'],
    queryFn: getEquipmentCategories,
  });

  const addEquipmentMutation = useMutation({
    mutationFn: async (data: CreateEquipmentData) => {
      return await createEquipment({ ...data, projectId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments', projectId] });
      setOpen(false);
      setFormData({
        name: '',
        model: '',
        capacity: '',
        purchaseDate: '',
        purchasePrice: '',
        rental: false,
        rentalVendor: '',
        rentalRate: '',
        status: 'AVAILABLE',
        categoryId: '',
      });
      toast.success('Equipment added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add equipment');
      console.error('Error adding equipment:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEquipmentMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof CreateEquipmentData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Equipment</DialogTitle>
          <DialogDescription>
            Add a new piece of equipment to your project inventory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category *
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => handleInputChange('categoryId', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category: EquipmentCategory) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model" className="text-right">
                Model
              </Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">
                Capacity
              </Label>
              <Input
                id="capacity"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="IN_USE">In Use</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rental" className="text-right">
                Rental
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rental"
                  checked={formData.rental}
                  onChange={(e) => handleInputChange('rental', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="rental">This is rental equipment</Label>
              </div>
            </div>

            {formData.rental ? (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rentalVendor" className="text-right">
                    Rental Vendor
                  </Label>
                  <Input
                    id="rentalVendor"
                    value={formData.rentalVendor}
                    onChange={(e) => handleInputChange('rentalVendor', e.target.value)}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rentalRate" className="text-right">
                    Rental Rate
                  </Label>
                  <Input
                    id="rentalRate"
                    type="number"
                    step="0.01"
                    value={formData.rentalRate}
                    onChange={(e) => handleInputChange('rentalRate', e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="purchaseDate" className="text-right">
                    Purchase Date
                  </Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="purchasePrice" className="text-right">
                    Purchase Price
                  </Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={addEquipmentMutation.isPending}>
              {addEquipmentMutation.isPending ? 'Adding...' : 'Add Equipment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}