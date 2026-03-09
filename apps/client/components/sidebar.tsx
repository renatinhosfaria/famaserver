"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
    Clock,
    Cloud,
    HardDrive,
    LogOut,
    Plus,
    Share2,
    Star,
    Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface StorageInfo {
  usedFormatted: string;
  totalFormatted: string;
  usePercent: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [storage, setStorage] = useState<StorageInfo | null>(null);

  const items = [
    { name: "Meu Drive", icon: HardDrive, href: "/drive" },
    { name: "Compartilhados", icon: Share2, href: "/drive/shared" },
    { name: "Recentes", icon: Clock, href: "/drive/recent" },
    { name: "Favoritos", icon: Star, href: "/drive/starred" },
    { name: "Lixeira", icon: Trash2, href: "/drive/trash" },
  ];

  const fetchStorage = async () => {
    try {
      const response = await api.get("/files/storage");
      setStorage(response.data);
    } catch (error) {
      console.error("Error fetching storage info:", error);
    }
  };

  useEffect(() => {
    fetchStorage();
    const interval = setInterval(fetchStorage, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "pb-12 w-64 border-r bg-sidebar/80 backdrop-blur-xl shadow-lg shadow-black/5 flex flex-col z-20 relative",
        className,
      )}
    >
      <div className="space-y-4 py-6 flex-1">
        <div className="px-4 py-2">
          <motion.h2 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mb-8 px-2 text-2xl font-bold tracking-tight text-primary flex items-center gap-3 drop-shadow-sm"
          >
            <div className="p-2 bg-primary/10 rounded-xl">
               <Cloud className="w-6 h-6 text-primary" />
            </div>
            FamaServer
          </motion.h2>
          <div className="space-y-1.5">
            <Button
              variant="default"
              className="w-full justify-start gap-3 mb-6 py-6 text-[15px] font-semibold rounded-xl shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" />
              Novo Upload
            </Button>

            {items.map((item, idx) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.href}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + (idx * 0.05), duration: 0.3 }}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3.5 mb-1 text-[14px] font-medium rounded-xl transition-all duration-200 relative overflow-hidden group h-11",
                      isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "text-sidebar-foreground/80 hover:text-foreground hover:bg-sidebar-accent/60"
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      {isActive && (
                        <motion.div 
                          layoutId="activeTab" 
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <item.icon className={cn("h-5 w-5 transition-transform duration-200 group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      {item.name}
                    </Link>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
        <Separator className="my-6 opacity-50" />
        <motion.div 
           initial={{ y: 10, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.5, duration: 0.3 }}
           className="px-6 py-2"
        >
          <h3 className="mb-3 text-xs font-bold uppercase text-muted-foreground/80 tracking-widest">
            Armazenamento
          </h3>
          <div className="py-2">
            <div className="flex justify-between text-xs mb-3 text-muted-foreground font-semibold">
              <span className="text-foreground">{storage?.usedFormatted || "..."}</span>
              <span>{storage?.totalFormatted || "..."}</span>
            </div>
            <div className="h-2.5 w-full bg-secondary/60 rounded-full overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${storage?.usePercent || 0}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
                className={cn(
                  "h-full shadow-sm rounded-full",
                  (storage?.usePercent || 0) > 90 ? "bg-destructive" :
                  (storage?.usePercent || 0) > 75 ? "bg-yellow-500" : "bg-primary"
                )}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-medium">
              <span className="text-foreground font-semibold">{storage?.usePercent || 0}%</span> utilizado
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Logout Button */}
      <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 0.6, duration: 0.3 }}
         className="px-4 py-5 border-t border-sidebar-border bg-sidebar/50"
      >
        <Button
          variant="ghost"
          className="w-full justify-start gap-3.5 text-destructive/80 hover:text-destructive hover:bg-destructive/10 font-semibold transition-all duration-200 rounded-xl h-11"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Sair
        </Button>
      </motion.div>
    </motion.div>
  );
}
