import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Droplet, MapPin, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InventoryItem {
  id: string;
  city: string;
  blood_group: string;
  quantity: number;
  updated_at: string;
}

export const InventoryManagement = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    city: '',
    blood_group: '',
    quantity: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('blood_inventory')
        .select('*')
        .eq('blood_bank_id', user.id)
        .order('city', { ascending: true })
        .order('blood_group', { ascending: true });

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (editItem) {
        // Update existing item
        const { error } = await supabase
          .from('blood_inventory')
          .update({
            quantity: parseInt(formData.quantity)
          })
          .eq('id', editItem.id);

        if (error) throw error;
        toast({ title: "Success", description: "Inventory updated successfully!" });
      } else {
        // Insert new item
        const { error } = await supabase
          .from('blood_inventory')
          .insert({
            blood_bank_id: user.id,
            city: formData.city,
            blood_group: formData.blood_group as any,
            quantity: parseInt(formData.quantity)
          });

        if (error) throw error;
        toast({ title: "Success", description: "Inventory item added successfully!" });
      }

      setOpen(false);
      setEditItem(null);
      setFormData({ city: '', blood_group: '', quantity: '' });
      fetchInventory();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditItem(item);
    setFormData({
      city: item.city,
      blood_group: item.blood_group,
      quantity: item.quantity.toString()
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blood_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Inventory item deleted" });
      fetchInventory();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditItem(null);
      setFormData({ city: '', blood_group: '', quantity: '' });
    }
  };

  // Group inventory by city
  const inventoryByCity = inventory.reduce((acc, item) => {
    if (!acc[item.city]) {
      acc[item.city] = [];
    }
    acc[item.city].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Blood Inventory</h2>
          <p className="text-muted-foreground">Manage your blood bank inventory by city</p>
        </div>
        <Dialog open={open} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" /> Add Inventory
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? 'Update' : 'Add'} Blood Inventory</DialogTitle>
              <DialogDescription>
                {editItem ? 'Update the quantity for this blood group' : 'Add blood group availability for a city'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>City *</Label>
                <Input 
                  value={formData.city} 
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="Enter city name"
                  required
                  disabled={!!editItem}
                />
              </div>

              <div>
                <Label>Blood Group *</Label>
                <Select 
                  value={formData.blood_group} 
                  onValueChange={(v) => setFormData({...formData, blood_group: v})} 
                  required
                  disabled={!!editItem}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity (units) *</Label>
                <Input 
                  type="number" 
                  value={formData.quantity} 
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  min="0"
                  required 
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : editItem ? "Update Inventory" : "Add to Inventory"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {inventory.length === 0 ? (
        <Card className="p-12 text-center">
          <Droplet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Inventory Yet</h3>
          <p className="text-muted-foreground">Add your first blood inventory record to get started</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(inventoryByCity).map(([city, items]) => (
            <Card key={city} className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold">{city}</h3>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Quantity (Units)</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Droplet className="h-4 w-4 text-primary" />
                          {item.blood_group}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={item.quantity === 0 ? "text-destructive font-semibold" : ""}>
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(item.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};