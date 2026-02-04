import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  Car,
  ShoppingCart,
  Receipt,
  FileText,
  Settings,
  ChevronRight,
  BookOpen,
  Search,
  CheckCircle2,
  Menu,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Card,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// --- Help Data ---
// You can extend this data structure to add more modules and tasks.
const helpData = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    description: "Get a high-level overview of your business performance.",
    tasks: [
      {
        title: "Navigating the Dashboard",
        description: "Learn how to read the main dashboard key metrics.",
        steps: [
          "Log in to the application to land on the Dashboard.",
          "View the top cards for 'Total Revenue', 'Active Customers', and 'Pending Orders'.",
          "Check the charts for sales trends over time.",
          "Review the 'Recent Activities' section for the latest system updates.",
        ],
      },
    ],
  },
  {
    id: "products",
    title: "Products Management",
    icon: Package,
    description: "Manage your product inventory, categories, and stock levels.",
    tasks: [
      {
        title: "Adding a New Product",
        description: "Step-by-step guide to adding a product to the catalog.",
        steps: [
          "Navigate to 'Products' > 'Add Product' from the sidebar.",
          "Fill in the 'Product Name' and 'Description'.",
          "Select the appropriate 'Category' and 'Unit'.",
          "Set the 'Selling Price' and 'Cost Price'.",
          "Upload product images if available.",
          "Click 'Save Product' to finish.",
        ],
      },
      {
        title: "Managing Stock",
        description: "How to update stock quantities and view history.",
        steps: [
          "Go to 'Products' > 'Stock Management'.",
          "Locate the product you want to update.",
          "Click on the 'Adjust Stock' button.",
          "Enter the quantity to add or remove.",
          "Provide a reason for the adjustment (e.g., 'New Shipment', 'Damaged Goods').",
          "Confirm the adjustment.",
        ],
      },
      {
        title: "Creating Categories",
        description: "Organize products into logical groups.",
        steps: [
          "Navigate to 'Products' > 'Categories'.",
          "Click the 'Add Category' button.",
          "Enter the category name and description.",
          "Click 'Save' to create the category.",
        ],
      },
    ],
  },
  {
    id: "customers",
    title: "Customer Relationship",
    icon: Users,
    description: "Manage customer profiles, view history, and handle assignments.",
    tasks: [
      {
        title: "Registering a New Customer",
        description: "Add a new client to your CRM.",
        steps: [
          "Go to 'Customers' > 'Add Customer'.",
          "Enter basic details: Name, Email, Phone Number.",
          "Add address information for billing and shipping.",
          "Assign a specific sales route if applicable.",
          "Click 'Create Customer' to save.",
        ],
      },
      {
        title: "Viewing Customer Details",
        description: "Access full customer history and orders.",
        steps: [
          "Go to 'Customers' > 'List of Active Customers'.",
          "Click on the 'View' icon (eye) next to a customer's name.",
          "Navigate through tabs to see 'Overview', 'Orders', 'Invoices', and 'Payments'.",
        ],
      },
    ],
  },
  {
    id: "suppliers",
    title: "Suppliers & Purchasing",
    icon: Car,
    description: "Manage vendor relationships, purchase orders, and payments.",
    tasks: [
      {
        title: "Adding a Supplier",
        description: "Register a new vendor in the system.",
        steps: [
          "Navigate to 'Suppliers' > 'Add Supplier'.",
          "Enter company name and contact person details.",
          "Provide payment terms and banking information if needed.",
          "Click 'Save' to add the supplier.",
        ],
      },
      {
        title: "Creating a Purchase Order",
        description: "Order goods from your suppliers.",
        steps: [
          "Go to 'Purchase Orders' > 'Add New Order'.",
          "Select the supplier and the warehouse.",
          "Add items to the purchase order.",
          "Review costs and tax information.",
          "Click 'Create Order' to send it to the supplier.",
        ],
      },
      {
        title: "Recording a Purchase Invoice",
        description: "Log an invoice received from a supplier.",
        steps: [
          "Go to 'Purchase Orders' > 'Purchase Invoices'.",
          "Select the purchase order related to the invoice.",
          "Enter the invoice number and date provided by the supplier.",
          "Verify the items and amounts.",
          "Save the invoice."
        ]
      }
    ],
  },
  {
    id: "sales",
    title: "Sales & Orders",
    icon: ShoppingCart,
    description: "Process orders, manage invoices, and handle payments.",
    tasks: [
      {
        title: "Creating a Sales Order",
        description: "Draft and confirm a new order for a customer.",
        steps: [
          "Go to 'Sales' > 'Create Order' (or 'Products' > 'Cart').",
          "Select the 'Customer' from the dropdown.",
          "Add products to the cart along with quantities.",
          "Review totals, taxes, and discounts.",
          "Click 'Place Order' to create a pending order.",
        ],
      },
      {
        title: "Generating an Invoice",
        description: "Convert an order into an invoice.",
        steps: [
          "Go to 'Sales' > 'Orders'.",
          "Select a confirmed order.",
          "Click the 'Generate Invoice' button.",
          "Review the invoice details.",
          "Click 'Save & Send' or 'Save Draft'.",
        ],
      },
    ],
  },
  {
    id: "route_operations",
    title: "Route Operations",
    icon: Map,
    description: "Manage delivery routes and assign orders to staff.",
    tasks: [
      {
        title: "Route Wise Order Management",
        description: "View and manage orders based on specific routes.",
        steps: [
          "Go to 'Route Operations' > 'Route Wise Order'.",
          "Select a route to view all associated pending orders.",
          "Re-arrange or prioritize orders for delivery.",
        ]
      },
      {
        title: "Assigning Staff to Routes",
        description: "Allocate delivery staff to specific routes.",
        steps: [
          "Navigate to 'Route Operations' > 'Staff Wise Route'.",
          "Select a staff member.",
          "Assign them to one or multiple routes.",
          "Save the assignment."
        ]
      }
    ]
  },
  {
    id: "accounting",
    title: "Accounting",
    icon: Receipt,
    description: "Track income, expenses, and financial overview.",
    tasks: [
      {
        title: "Recording an Expense",
        description: "Log a business expense.",
        steps: [
          "Go to 'Accounting' > 'Add Expense'.",
          "Select the expense category (e.g., 'Rent', 'Utilities').",
          "Enter the amount and date.",
          "Upload a receipt image if available.",
          "Click 'Save Expense'.",
        ],
      },
    ],
  },
  {
    id: "users",
    title: "User Management",
    icon: Users,
    description: "Manage system users, roles, and permissions.",
    tasks: [
      {
        title: "Adding a System User",
        description: "Grant access to the ERP system.",
        steps: [
          "Go to 'Users' > 'Add User'.",
          "Enter the user's name, email, and password.",
          "Assign a Role (e.g., 'Admin', 'Sales Manager').",
          "Click 'Create User'.",
        ]
      },
      {
        title: "Managing Roles",
        description: "Define what users can see and do.",
        steps: [
          "Go to 'Roles & Permissions' > 'Roles'.",
          "Create a new role or edit an existing one.",
          "Check the boxes for permissions (View, Create, Edit, Delete) for each module.",
          "Save the role configuration."
        ]
      }
    ]
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    icon: FileText,
    description: "View detailed reports on sales, inventory, and customers.",
    tasks: [
      {
        title: "Generating Sales Report",
        description: "Export sales data for a specific period.",
        steps: [
          "Go to 'Reports' section.",
          "Select 'Sales Reports'.",
          "Choose the date range (e.g., 'Last 30 Days', 'Custom Range').",
          "Click 'Generate Report'.",
          "Use the 'Export' button to download as PDF or Excel.",
        ],
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    description: "Configure system preferences and account settings.",
    tasks: [
      {
        title: "Updating Profile",
        description: "Change your password or profile picture.",
        steps: [
          "Click on your avatar in the top right corner.",
          "Select 'Profile Settings'.",
          "Update your personal information.",
          "To change password, go to the 'Security' tab and follow instructions.",
        ],
      },
    ],
  },
  {
    id: "staff",
    title: "Staff Management",
    icon: Users,
    description: "Manage staff profiles, attendance, and permissions.",
    tasks: [
      {
        title: "Adding New Staff",
        description: "Onboard a new employee.",
        steps: [
          "Go to 'Staffs' > 'Add Staff'.",
          "Fill in personal details and contact info.",
          "Set their role and permissions.",
          "Create their login credentials.",
          "Click 'Save' to creates the staff account."
        ]
      },
      {
        title: "Checking Attendance",
        description: "View daily attendance records.",
        steps: [
          "Navigate to 'Staffs' > 'Attendance'.",
          "Filter by date or staff name.",
          "View check-in and check-out times."
        ]
      }
    ]
  }
];

export default function Help() {
  const [selectedModuleId, setSelectedModuleId] = useState(helpData[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedModule = helpData.find((m) => m.id === selectedModuleId);

  // Filter modules based on search
  const filteredModules = helpData.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tasks.some((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar for Desktop */}
      <aside className="hidden w-80 border-r bg-muted/10 md:flex md:flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Help Center</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search help topics..."
              className="pl-8 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredModules.map((module) => (
              <button
                key={module.id}
                onClick={() => setSelectedModuleId(module.id)}
                className={cn(
                  "w-full flex items-start text-left gap-3 p-3 rounded-lg transition-all",
                  selectedModuleId === module.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <module.icon className="h-5 w-5 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">{module.title}</div>
                  <div
                    className={cn(
                      "text-xs line-clamp-1 mt-0.5",
                      selectedModuleId === module.id
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground/80"
                    )}
                  >
                    {module.description}
                  </div>
                </div>
              </button>
            ))}
            {filteredModules.length === 0 && (
              <div className="text-center p-4 text-muted-foreground text-sm">
                No matching topics found.
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center border-b px-6 py-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-4">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-bold">Help Center</h2>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-140px)]">
                <div className="p-4 space-y-2">
                  {filteredModules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => setSelectedModuleId(module.id)}
                      className={cn(
                        "w-full flex items-start text-left gap-3 p-3 rounded-lg transition-all",
                        selectedModuleId === module.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <module.icon className="h-5 w-5 mt-0.5" />
                      <div>
                        <div className="font-semibold text-sm">
                          {module.title}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Help & Documentation</span>
        </header>

        {selectedModule ? (
          <ScrollArea className="flex-1 p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Header Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-primary">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <selectedModule.icon className="h-8 w-8" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {selectedModule.title}
                  </h1>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  {selectedModule.description}
                </p>
              </div>

              <div className="h-px bg-border w-full" />

              {/* Tasks Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Common Tasks</h3>
                <div className="grid gap-4">
                  {selectedModule.tasks.map((task, index) => (
                    <Card key={index} className="overflow-hidden border-muted/60 shadow-sm hover:shadow-md transition-shadow">
                      <Collapsible className="group">
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-6 text-left">
                          <div className="space-y-1">
                            <h4 className="font-medium text-lg leading-none group-hover:text-primary transition-colors">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground transition-colors">
                            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-6 pb-6 pt-2">
                            <div className="space-y-4 rounded-md bg-muted/30 p-4 border border-muted-foreground/10">
                              <h5 className="font-medium text-sm text-foreground/80 uppercase tracking-wider">
                                Follow these steps:
                              </h5>
                              <ul className="space-y-4">
                                {task.steps.map((step, stepIndex) => (
                                  <li
                                    key={stepIndex}
                                    className="flex items-start gap-3 text-sm text-muted-foreground"
                                  >
                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                                      {stepIndex + 1}
                                    </span>
                                    <span className="leading-relaxed pt-0.5">
                                      {step}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              <div className="pt-2 flex items-center gap-2 text-xs text-green-600 font-medium">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>End of procedure</span>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a module to view help documentation.
          </div>
        )}
      </main>
    </div>
  );
}
