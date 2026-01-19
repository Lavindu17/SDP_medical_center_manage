import { getAuthUser } from "@/lib/auth";
import { getInventory } from "@/lib/actions/pharmacy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function InventoryPage() {
    const user = await getAuthUser();
    const inventory = await getInventory();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
                    <p className="text-slate-500">View and manage medicine stock</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Stock</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Medicine</TableHead>
                                <TableHead>Batch Info</TableHead>
                                <TableHead>Expiry</TableHead>
                                <TableHead>Stock Level</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inventory && inventory.length > 0 ? (
                                (inventory as any[]).map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            {item.medicine?.brand_name}
                                            <div className="text-xs text-slate-500">{item.medicine?.generic_name} ({item.medicine?.unit})</div>
                                        </TableCell>
                                        <TableCell>{item.batch_number}</TableCell>
                                        <TableCell>{new Date(item.expiry_date).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-bold">{item.stock_level}</TableCell>
                                        <TableCell>Rs. {item.unit_price}</TableCell>
                                        <TableCell>
                                            {item.stock_level < 10 ? (
                                                <Badge variant="destructive">Low Stock</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">In Stock</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        No inventory items found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
