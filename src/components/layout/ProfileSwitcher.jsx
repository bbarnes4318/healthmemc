import React, { useState } from "react";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Users, ChevronDown, UserPlus, Check, User } from "lucide-react";
import FamilyMemberModal from "@/components/family/FamilyMemberModal";

export default function ProfileSwitcher() {
  const { members, currentMemberId, currentMemberName, currentMemberPhoto, switchMember, loadMembers } = useFamilyMember();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-9 max-w-[200px]">
            {currentMemberPhoto ? (
              <img src={currentMemberPhoto} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center">
                <User className="w-3 h-3 text-sky-600" />
              </div>
            )}
            <span className="truncate text-xs font-medium">{currentMemberName}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="text-xs">Switch Profile</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2" onClick={() => switchMember(null)}>
            <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <span className="text-sm flex-1">You</span>
            {!currentMemberId && <Check className="w-3.5 h-3.5 text-sky-600" />}
          </DropdownMenuItem>
          {(Array.isArray(members) ? members : []).map((m) => (
            <DropdownMenuItem key={m.id} className="flex items-center gap-2" onClick={() => switchMember(m.id)}>
              {m.photo_url ? (
                <img src={m.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-violet-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{m.relationship}</p>
              </div>
              {currentMemberId === m.id && <Check className="w-3.5 h-3.5 text-sky-600" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2 text-sky-600" onClick={() => setModalOpen(true)}>
            <UserPlus className="w-3.5 h-3.5" />
            <span className="text-sm">Add Family Member</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FamilyMemberModal open={modalOpen} onOpenChange={setModalOpen} onSaved={loadMembers} />
    </>
  );
}