export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    
    <div className="flex h-screen">
      
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Clinic Admin</h2>
        <ul className="space-y-3">
          <li>Dashboard</li>
          <li>Patients</li>
          <li>Appointments</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100">
        {children}
      </div>

    </div>
  );
}