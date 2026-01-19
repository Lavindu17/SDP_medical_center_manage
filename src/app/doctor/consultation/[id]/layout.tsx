export default async function ConsultationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-100 p-4 lg:p-6 overflow-hidden max-h-screen">
            {children}
        </div>
    );
}
