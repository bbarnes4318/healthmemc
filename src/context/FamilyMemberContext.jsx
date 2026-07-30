import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const FamilyMemberContext = createContext();

export function FamilyMemberProvider({ children }) {
  const [members, setMembers] = useState([]);
  const [currentMemberId, setCurrentMemberId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMembers = async () => {
    try {
      const data = await base44.entities.FamilyMember.list("-created_date", 50);
      setMembers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setMembers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMembers();
    const saved = localStorage.getItem("current_family_member");
    if (saved && saved !== "self") setCurrentMemberId(saved);
  }, []);

  const switchMember = (id) => {
    setCurrentMemberId(id);
    localStorage.setItem("current_family_member", id || "self");
  };

  const safeMembers = Array.isArray(members) ? members : [];
  const currentMember = safeMembers.find((m) => m?.id === currentMemberId);

  return (
    <FamilyMemberContext.Provider value={{
      members,
      currentMember,
      currentMemberId,
      currentMemberName: currentMember?.name || "You",
      currentMemberPhoto: currentMember?.photo_url || null,
      switchMember,
      loadMembers,
      loading,
      isViewingSelf: !currentMemberId,
    }}>
      {children}
    </FamilyMemberContext.Provider>
  );
}

export function useFamilyMember() {
  return useContext(FamilyMemberContext);
}