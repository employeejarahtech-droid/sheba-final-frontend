// import { useParams, Link } from "react-router";
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardContent,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Mail, Phone, User, ArrowLeft } from "lucide-react";

// // Dummy data — replace with API later
// const dummyUsers = [
//   {
//     id: "1",
//     name: "Rabby Hasan",
//     email: "rabby@example.com",
//     phone: "+8801700000000",
//     role: "Admin",
//     status: "Active",
//   },
//   {
//     id: "2",
//     name: "Nabil Khan",
//     email: "nabil@example.com",
//     phone: "+8801800000000",
//     role: "User",
//     status: "Inactive",
//   },
// ];

// export default function UserDetails() {
//   const { userId } = useParams();
//   const user = dummyUsers.find((u) => u.id === userId);

//   if (!user) {
//     return (
//       <div className="text-center text-red-500 text-lg py-10">
//         User Not Found
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-3xl mx-auto py-6 space-y-6">
//       {/* BACK BUTTON */}
//       <div className="flex items-center gap-4">
//         <Link to="/dashboard/users/list">
//           <Button variant="outline">
//             <ArrowLeft className="mr-2 h-4 w-4" /> Back
//           </Button>
//         </Link>

//         <h1 className="text-3xl font-bold">User Details</h1>
//       </div>

//       {/* PROFILE CARD */}
//       <Card>
//         <CardHeader className="flex flex-row items-center gap-4">
//           <Avatar className="w-16 h-16">
//             <AvatarFallback className="text-xl">
//               {user.name.charAt(0)}
//             </AvatarFallback>
//           </Avatar>

//           <div>
//             <CardTitle className="text-xl">{user.name}</CardTitle>
//             <div className="mt-1 flex gap-2">
//               <Badge variant="outline">{user.role}</Badge>
//               <Badge
//                 className={
//                   user.status === "Active"
//                     ? "bg-green-600 text-white"
//                     : "bg-red-600 text-white"
//                 }
//               >
//                 {user.status}
//               </Badge>
//             </div>
//           </div>
//         </CardHeader>

//         <Separator />

//         {/* USER INFO */}
//         <CardContent className="grid gap-4 py-6">
//           {/* EMAIL */}
//           <div className="flex items-center gap-4">
//             <Mail className="h-5 w-5 opacity-70" />
//             <div>
//               <p className="text-sm text-muted-foreground">Email</p>
//               <p className="font-medium">{user.email}</p>
//             </div>
//           </div>

//           {/* PHONE */}
//           <div className="flex items-center gap-4">
//             <Phone className="h-5 w-5 opacity-70" />
//             <div>
//               <p className="text-sm text-muted-foreground">Phone</p>
//               <p className="font-medium">{user.phone || "N/A"}</p>
//             </div>
//           </div>

//           {/* ROLE */}
//           <div className="flex items-center gap-4">
//             <User className="h-5 w-5 opacity-70" />
//             <div>
//               <p className="text-sm text-muted-foreground">Role</p>
//               <p className="font-medium">{user.role}</p>
//             </div>
//           </div>

//           {/* STATUS */}
//           <div className="flex items-center gap-4">
//             <span className="h-5 w-5 rounded-full bg-gray-400 opacity-70"></span>
//             <div>
//               <p className="text-sm text-muted-foreground">Status</p>
//               <p
//                 className={`font-medium ${
//                   user.status === "Active"
//                     ? "text-green-600"
//                     : "text-red-600"
//                 }`}
//               >
//                 {user.status}
//               </p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* ACTION BUTTONS */}
//       <div className="flex justify-end gap-3">
//         <Link to={`/dashboard/users/${user.id}/edit`}>
//           <Button variant="default">Edit User</Button>
//         </Link>

//         <Button variant="destructive">Delete User</Button>
//       </div>
//     </div>
//   );
// }





import { useParams, Link } from "react-router";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, User, ArrowLeft } from "lucide-react";
import { useGetUserByIdQuery } from "@/store/features/users/usersApiService";

export default function UserDetails() {
  const { userId } = useParams();
  const { data: userData, isLoading } = useGetUserByIdQuery(userId as string);


  const user = Array.isArray(userData?.data) ? undefined : userData?.data;

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="text-center text-red-500 text-lg py-10">
        User Not Found
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* BACK BUTTON */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard/users/list">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold">User Details</h1>
      </div>

      {/* PROFILE CARD */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="text-xl">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div>
            <CardTitle className="text-xl">{user.name}</CardTitle>
            <div className="mt-1 flex gap-2">
              {/* ROLE BADGE */}
              <Badge variant="outline">{user.role?.role}</Badge>
            </div>
          </div>
        </CardHeader>

        <Separator />

        {/* USER INFO */}
        <CardContent className="grid gap-4 py-6">
          {/* EMAIL */}
          <div className="flex items-center gap-4">
            <Mail className="h-5 w-5 opacity-70" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>

          {/* ROLE */}
          <div className="flex items-center gap-4">
            <User className="h-5 w-5 opacity-70" />
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium">{user.role?.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3">
        <Link to={`/dashboard/users/${user.id}/edit`}>
          <Button variant="default">Edit User</Button>
        </Link>

        <Button variant="destructive">Delete User</Button>
      </div>
    </div>
  );
}
