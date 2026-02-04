import { createFileRoute } from '@tanstack/react-router';
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { TopNav } from "@/components/layout/top-nav";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { topNav } from '@/data/data';
import { Calendar, DollarSign, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_authenticated/accounts/pay-to-surgeon/')({
    component: PayToSurgeonPage,
})

type SurgeonPayment = {
    id: string;
    date: string;
    surgeonName: string;
    surgeonId: string;
    patientName: string;
    surgeryType: string;
    surgeryFee: number;
    hospitalShare: number;
    surgeonShare: number;
    paymentMethod: string;
    paymentStatus: 'paid' | 'pending' | 'partial';
    reference: string;
    notes: string;
};

function PayToSurgeonPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [surgeonId, setSurgeonId] = useState('');
    const [patientName, setPatientName] = useState('');
    const [surgeryType, setSurgeryType] = useState('');
    const [surgeryFee, setSurgeryFee] = useState('');
    const [hospitalSharePercent, setHospitalSharePercent] = useState('30');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('paid');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    // Sample surgeon payment records
    const [surgeonPayments] = useState<SurgeonPayment[]>([
        {
            id: '1',
            date: '2026-01-13',
            surgeonName: 'Dr. Ahmed Rahman',
            surgeonId: 'SRG-001',
            patientName: 'Mohammad Ali',
            surgeryType: 'Appendectomy',
            surgeryFee: 50000,
            hospitalShare: 15000,
            surgeonShare: 35000,
            paymentMethod: 'Bank Transfer',
            paymentStatus: 'paid',
            reference: 'PAY-SRG-1001',
            notes: 'Emergency surgery',
        },
        {
            id: '2',
            date: '2026-01-13',
            surgeonName: 'Dr. Fatima Khan',
            surgeonId: 'SRG-002',
            patientName: 'Ayesha Begum',
            surgeryType: 'Cesarean Section',
            surgeryFee: 40000,
            hospitalShare: 12000,
            surgeonShare: 28000,
            paymentMethod: 'Cash',
            paymentStatus: 'paid',
            reference: 'PAY-SRG-1002',
            notes: '',
        },
        {
            id: '3',
            date: '2026-01-13',
            surgeonName: 'Dr. Karim Hossain',
            surgeonId: 'SRG-003',
            patientName: 'Rahim Uddin',
            surgeryType: 'Hernia Repair',
            surgeryFee: 35000,
            hospitalShare: 10500,
            surgeonShare: 24500,
            paymentMethod: 'Cheque',
            paymentStatus: 'pending',
            reference: 'PAY-SRG-1003',
            notes: 'Payment scheduled for next week',
        },
    ]);

    // Calculate shares
    const calculateShares = () => {
        const fee = parseFloat(surgeryFee) || 0;
        const hospitalPercent = parseFloat(hospitalSharePercent) || 0;
        const hospitalAmount = (fee * hospitalPercent) / 100;
        const surgeonAmount = fee - hospitalAmount;
        return { hospitalAmount, surgeonAmount };
    };

    const { hospitalAmount, surgeonAmount } = calculateShares();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Surgeon Payment Submitted:', {
            date,
            surgeonId,
            patientName,
            surgeryType,
            surgeryFee,
            hospitalShare: hospitalAmount,
            surgeonShare: surgeonAmount,
            paymentMethod,
            paymentStatus,
            reference,
            notes,
        });
        // Reset form
        setSurgeonId('');
        setPatientName('');
        setSurgeryType('');
        setSurgeryFee('');
        setPaymentMethod('');
        setReference('');
        setNotes('');
    };

    // Filter entries by selected date
    const filteredPayments = surgeonPayments.filter(payment => payment.date === filterDate);
    const totalSurgeryFees = filteredPayments.reduce((sum, payment) => sum + payment.surgeryFee, 0);
    const totalSurgeonShare = filteredPayments.reduce((sum, payment) => sum + payment.surgeonShare, 0);
    const totalHospitalShare = filteredPayments.reduce((sum, payment) => sum + payment.hospitalShare, 0);

    return (
        <>
            <Header fixed>
                <TopNav links={topNav} />
                <div className='ms-auto flex items-center space-x-4'>
                    <Search />
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>
            <Main>
                <div className="space-y-6">
                    {/* Page Header */}
                    <div>
                        <h1 className='text-2xl font-bold tracking-tight'>Payment to Surgeon</h1>
                        <p className='text-muted-foreground'>Manage and track surgeon payments and revenue sharing</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Surgeries</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{filteredPayments.length}</div>
                                <p className="text-xs text-muted-foreground">for selected date</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Surgery Fees</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">৳{totalSurgeryFees.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">total collected</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Surgeon Share</CardTitle>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">৳{totalSurgeonShare.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">to be paid</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Hospital Share</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">৳{totalHospitalShare.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">hospital revenue</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payment Entry Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Record Surgeon Payment</CardTitle>
                            <CardDescription>Enter surgery details and payment information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Surgery Date</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="surgeon">Surgeon</Label>
                                        <Select value={surgeonId} onValueChange={setSurgeonId} required>
                                            <SelectTrigger id="surgeon">
                                                <SelectValue placeholder="Select surgeon" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SRG-001">Dr. Ahmed Rahman (SRG-001)</SelectItem>
                                                <SelectItem value="SRG-002">Dr. Fatima Khan (SRG-002)</SelectItem>
                                                <SelectItem value="SRG-003">Dr. Karim Hossain (SRG-003)</SelectItem>
                                                <SelectItem value="SRG-004">Dr. Nasrin Akter (SRG-004)</SelectItem>
                                                <SelectItem value="SRG-005">Dr. Mahmud Hassan (SRG-005)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="patientName">Patient Name</Label>
                                        <Input
                                            id="patientName"
                                            placeholder="Enter patient name"
                                            value={patientName}
                                            onChange={(e) => setPatientName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="surgeryType">Surgery Type</Label>
                                        <Select value={surgeryType} onValueChange={setSurgeryType} required>
                                            <SelectTrigger id="surgeryType">
                                                <SelectValue placeholder="Select surgery type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="appendectomy">Appendectomy</SelectItem>
                                                <SelectItem value="cesarean">Cesarean Section</SelectItem>
                                                <SelectItem value="hernia">Hernia Repair</SelectItem>
                                                <SelectItem value="gallbladder">Gallbladder Removal</SelectItem>
                                                <SelectItem value="orthopedic">Orthopedic Surgery</SelectItem>
                                                <SelectItem value="cardiac">Cardiac Surgery</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <Label className="text-base font-semibold">Fee Distribution</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="surgeryFee">Total Surgery Fee (৳)</Label>
                                            <Input
                                                id="surgeryFee"
                                                type="number"
                                                placeholder="0.00"
                                                value={surgeryFee}
                                                onChange={(e) => setSurgeryFee(e.target.value)}
                                                required
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hospitalShare">Hospital Share (%)</Label>
                                            <Input
                                                id="hospitalShare"
                                                type="number"
                                                placeholder="30"
                                                value={hospitalSharePercent}
                                                onChange={(e) => setHospitalSharePercent(e.target.value)}
                                                required
                                                step="1"
                                                min="0"
                                                max="100"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Surgeon Share (%)</Label>
                                            <Input
                                                type="number"
                                                value={100 - parseFloat(hospitalSharePercent || '0')}
                                                disabled
                                                className="bg-muted"
                                            />
                                        </div>
                                    </div>

                                    {/* Calculated Amounts */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                        <div>
                                            <Label className="text-sm text-muted-foreground">Hospital Amount</Label>
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">৳{hospitalAmount.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm text-muted-foreground">Surgeon Amount</Label>
                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">৳{surgeonAmount.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentMethod">Payment Method</Label>
                                        <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                                            <SelectTrigger id="paymentMethod">
                                                <SelectValue placeholder="Select method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="cheque">Cheque</SelectItem>
                                                <SelectItem value="mobile-banking">Mobile Banking</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="paymentStatus">Payment Status</Label>
                                        <Select value={paymentStatus} onValueChange={(value: any) => setPaymentStatus(value)} required>
                                            <SelectTrigger id="paymentStatus">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="partial">Partial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reference">Reference/Payment No.</Label>
                                        <Input
                                            id="reference"
                                            placeholder="PAY-SRG-001"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Additional notes or comments"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <Separator />

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline">Cancel</Button>
                                    <Button type="submit">Save Payment Record</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Payment Records */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Surgeon Payment Records</CardTitle>
                                    <CardDescription>View and manage surgeon payment history</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="filterDate" className="text-sm">Filter by Date:</Label>
                                    <Input
                                        id="filterDate"
                                        type="date"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="w-auto"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Surgeon</TableHead>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Surgery Type</TableHead>
                                            <TableHead className="text-right">Total Fee</TableHead>
                                            <TableHead className="text-right">Hospital</TableHead>
                                            <TableHead className="text-right">Surgeon</TableHead>
                                            <TableHead>Payment</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPayments.length > 0 ? (
                                            <>
                                                {filteredPayments.map((payment) => (
                                                    <TableRow key={payment.id}>
                                                        <TableCell>{payment.date}</TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">{payment.surgeonName}</div>
                                                            <div className="text-xs text-muted-foreground">{payment.surgeonId}</div>
                                                        </TableCell>
                                                        <TableCell>{payment.patientName}</TableCell>
                                                        <TableCell>{payment.surgeryType}</TableCell>
                                                        <TableCell className="text-right font-semibold">৳{payment.surgeryFee.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right text-green-600 dark:text-green-400">৳{payment.hospitalShare.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right text-blue-600 dark:text-blue-400">৳{payment.surgeonShare.toFixed(2)}</TableCell>
                                                        <TableCell className="text-sm">{payment.paymentMethod}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={
                                                                payment.paymentStatus === 'paid' ? 'default' :
                                                                    payment.paymentStatus === 'pending' ? 'secondary' : 'outline'
                                                            }>
                                                                {payment.paymentStatus}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button size="sm" variant="outline">View</Button>
                                                                <Button size="sm" variant="outline">Edit</Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {/* Total Row */}
                                                <TableRow className="font-bold bg-muted/50">
                                                    <TableCell colSpan={4} className="text-right">Total</TableCell>
                                                    <TableCell className="text-right">৳{totalSurgeryFees.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right text-green-600 dark:text-green-400">৳{totalHospitalShare.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right text-blue-600 dark:text-blue-400">৳{totalSurgeonShare.toFixed(2)}</TableCell>
                                                    <TableCell colSpan={3}></TableCell>
                                                </TableRow>
                                            </>
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                                                    No payment records found for {filterDate}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    );
}
