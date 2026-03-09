"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, HelpCircle, Search, Settings } from "lucide-react";
import { motion } from "framer-motion";

export function Header() {
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-white/10 dark:border-white/5 bg-background/70 backdrop-blur-2xl shadow-sm px-8"
    >
      <div className="w-full flex-1 md:w-auto md:flex-none">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="relative group"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            type="search"
            placeholder="Pesquisar no Drive..."
            className="w-full md:w-[350px] lg:w-[450px] xl:w-[600px] pl-11 h-11 bg-muted/40 border-transparent shadow-inner rounded-2xl transition-all duration-300 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 hover:bg-muted/60"
          />
        </motion.div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
           <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all w-10 h-10">
             <HelpCircle className="h-5 w-5" />
           </Button>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
           <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all w-10 h-10">
             <Settings className="h-5 w-5" />
           </Button>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="relative mr-2">
           <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all w-10 h-10">
             <Bell className="h-5 w-5" />
           </Button>
           <span className="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-background animate-pulse" />
        </motion.div>

        <motion.div 
           initial={{ scale: 0.8, opacity: 0 }} 
           animate={{ scale: 1, opacity: 1 }} 
           transition={{ delay: 0.45, type: "spring", stiffness: 300 }}
        >
           <Avatar className="h-10 w-10 border-2 border-transparent cursor-pointer hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95">
             <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
             <AvatarFallback className="bg-primary/10 text-primary font-semibold">CN</AvatarFallback>
           </Avatar>
        </motion.div>
      </div>
    </motion.header>
  );
}
