import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import logo from "../../../public/brand/logo.png";

export function LogoMark({ className }: { className?: string }) {
  return <Image src={logo} alt="" width={32} height={32} priority className={cn("size-8 shrink-0", className)} />;
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5 rounded-lg", className)} aria-label="FIN-Painel — página inicial">
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight text-text">
        FIN<span className="text-brand">-</span>Painel
      </span>
    </Link>
  );
}
