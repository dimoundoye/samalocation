import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Plus, Users, Settings, LogOut, MessageSquare, TrendingUp, Menu, Building2, Send, Phone, Trash2, Edit, ArrowLeft, History, PieChart, ChevronLeft, ChevronRight, BarChart3, Wrench, FolderOpen, AlertCircle, AlertTriangle, FileText, Shield, CreditCard, Users2, Briefcase, User as UserIcon, Clock, CheckCircle2, X, Globe } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  getOwnerProperties,
  getOwnerTenants,
  getMessages,
  sendMessage,
  togglePropertyPublication,
  searchUsers,
  markMessagesAsRead,
  deleteMessage,
  updateTenant,
  deleteTenant,
  getOwnerReceipts,
  downloadReceipt,
  deleteProperty,
  updateProperty,
  getOwnerMaintenanceRequests,
  getOwnerProfile
} from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PenTool, ArrowRight } from "lucide-react";
import { AddPropertyModal } from "@/components/owner/AddPropertyModal";
import { EditPropertyModal } from "@/components/owner/EditPropertyModal";
import { OwnerSettings } from "@/components/owner/OwnerSettings";
import { NotificationBell } from "@/components/NotificationBell";
import { UserProfile } from "@/components/UserProfile";
import { AssignTenantDialog } from "@/components/owner/AssignTenantDialog";
import { EditTenantDialog } from "@/components/owner/EditTenantDialog";
import { CreateReceiptDialog } from "@/components/owner/CreateReceiptDialog";
import { useAuth } from "@/contexts/AuthContext";
import { TenantHistoryDialog } from "@/components/owner/TenantHistoryDialog";
import { ManagementTable } from "@/components/owner/ManagementTable";
import { OwnerMaintenanceTab } from "@/components/owner/OwnerMaintenanceTab";
import { OwnerContractsTab } from "@/components/owner/OwnerContractsTab";
import { OwnerSubscription } from "@/components/owner/OwnerSubscription";
import { OwnerTeamTab } from "@/components/owner/OwnerTeamTab";
import { CreateContractDialog } from "@/components/owner/CreateContractDialog";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { transformProperty } from "@/lib/property";
import { Property, PropertyUnit, Tenant, Message, Receipt } from "@/types";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSocket } from "@/contexts/SocketContext";
import { useTranslation } from "react-i18next";
import { OnboardingChecklist } from "@/components/owner/OnboardingChecklist";
import { useSubscription } from "@/hooks/useSubscription";
import { OwnerPublicProfileEditor } from "@/components/owner/OwnerPublicProfileEditor";

const DashboardProprietaire = () => {
  const navigate = useNavigate();
  const { tab: urlTab } = useParams();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { signOut, user, loading: authLoading } = useAuth();
  const { subscription } = useSubscription();
  const dateLocale = i18n.language === 'en' ? enUS : fr;

  useEffect(() => {
    if (!authLoading && user && user.role !== 'owner' && user.role !== 'admin') {
      console.log("[DASHBOARD] Non-owner access detected, redirecting...");
      navigate("/tenant-dashboard");
    }
  }, [user, authLoading, navigate]);

  const [activeTab, setActiveTab] = useState(urlTab || "dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null); // Contact unique (locataire ou candidat)
  const [newMessage, setNewMessage] = useState("");
  const [stats, setStats] = useState({
    totalProperties: 0,
    occupiedUnits: 0,
    activeTenants: 0,
  });
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [editPropertyOpen, setEditPropertyOpen] = useState(false);
  const [selectedPropertyForEdit, setSelectedPropertyForEdit] = useState<Property | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPropertyForAssign, setSelectedPropertyForAssign] = useState<Property | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [createReceiptOpen, setCreateReceiptOpen] = useState(false);
  const [selectedPropertyForReceipt, setSelectedPropertyForReceipt] = useState<Tenant | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [assignTenantOpen, setAssignTenantOpen] = useState(false);
  const [editTenantOpen, setEditTenantOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [activeContext, setActiveContext] = useState(localStorage.getItem("active_context") || "personal");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const switchContext = (context: string) => {
    if (context === "personal") {
      localStorage.removeItem("active_context");
    } else {
      localStorage.setItem("active_context", context);
    }
    setActiveContext(context);
    loadData();
    loadReceipts();
    toast({
      title: "Changement de compte",
      description: context === "personal" ? "Basculement vers votre compte personnel." : "Basculement vers le compte de l'entreprise.",
    });
  };
  const [selectedTenantForHistory, setSelectedTenantForHistory] = useState<Tenant | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });
  const [tenantSearch, setTenantSearch] = useState("");
  const [createContractOpen, setCreateContractOpen] = useState(false);
  const [selectedTenantForContract, setSelectedTenantForContract] = useState<Tenant | null>(null);

  const userGroupsKey = useMemo(() => user?.id ? `owner_tenant_groups_v2_${user.id}` : "owner_tenant_groups_v2_guest", [user?.id]);
  const [customGroups, setCustomGroups] = useState<{ id: string; name: string; tenantIds: string[]; parentId?: string }[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set<number>([currentYear, currentYear + 1, currentYear - 1]);
    receipts.forEach((r: any) => {
      const rYear = typeof r.year === 'string' ? parseInt(r.year) : r.year;
      if (rYear) yearsSet.add(rYear);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [receipts]);

  const totalYearlyRevenue = useMemo(() => {
    const year = parseInt(selectedYear);
    return receipts
      .filter(r => {
        const rYear = typeof r.year === 'string' ? parseInt(r.year) : r.year;
        return rYear === year;
      })
      .reduce((acc, r) => acc + Number(r.amount), 0);
  }, [receipts, selectedYear]);

  const [navigationPath, setNavigationPath] = useState<string[]>([]); // Array of group IDs

  // Sync groups when user changes
  useEffect(() => {
    if (!user?.id) return;
    const saved = localStorage.getItem(userGroupsKey);
    if (saved) {
      try {
        setCustomGroups(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse custom groups", e);
      }
    }
  }, [userGroupsKey, user?.id]);

  const canSeeRevenue = !user?.parentId || activeContext === 'personal' || user?.permissions?.can_view_revenue;

  const groupedData = useMemo(() => {
    // 1. Prepare all properties and their units
    const propertyNodes = properties.map(property => ({
      id: property.id,
      name: property.name,
      type: 'property' as const,
      units: (property.property_units || []).map(unit => {
        const tenant = tenants.find(t => t.unit_id === unit.id);
        return { unit, tenant };
      })
    }));

    // 2. Prepare custom groups
    const groupNodes = customGroups.map(cg => ({
      id: cg.id,
      name: cg.name,
      type: 'group' as const,
      parentId: cg.parentId,
      tenantIds: cg.tenantIds,
      children: [] as any[]
    }));

    // 3. Find assigned entities
    const assignedPropertyIds = new Set<string>();
    propertyNodes.forEach(pNode => {
      const groupWithProp = groupNodes.find(g =>
        pNode.units.some(u => {
          if (!u.tenant) return false;
          const tId = String(u.tenant.id);
          return g.tenantIds.some(id => String(id) === tId);
        })
      );
      if (groupWithProp) {
        groupWithProp.children.push(pNode);
        assignedPropertyIds.add(pNode.id);
      }
    });

    // 4. Build Group Hierarchy
    const rootNodes: any[] = [];
    const groupMap = new Map(groupNodes.map(g => [g.id, g]));
    groupNodes.forEach(g => {
      if (g.parentId && groupMap.has(g.parentId)) {
        groupMap.get(g.parentId)!.children.push(g);
      } else {
        rootNodes.push(g);
      }
    });

    // 5. Add remaining properties to root
    propertyNodes.forEach(pNode => {
      if (!assignedPropertyIds.has(pNode.id)) {
        rootNodes.push(pNode);
      }
    });

    // 6. Handle stray tenants
    const allAssignedTenants = new Set([
      ...properties.flatMap(p => (p.property_units || []).map(u => tenants.find(t => t.unit_id === u.id)?.id)).filter(Boolean),
      ...customGroups.flatMap(cg => cg.tenantIds)
    ]);
    const unassignedTenants = tenants.filter(t => t && !allAssignedTenants.has(t.id));

    if (unassignedTenants.length > 0) {
      rootNodes.push({
        id: "default",
        name: "Locataires non classés",
        type: 'group',
        children: unassignedTenants.map(tenant => ({
          id: `stray-${tenant.id}`,
          name: tenant.full_name,
          type: 'property',
          units: [{
            unit: { id: tenant.unit_id, unit_number: tenant.unit_number } as PropertyUnit,
            tenant
          }]
        }))
      });
    }

    return rootNodes;
  }, [properties, tenants, customGroups]);

  const getCurrentNodes = () => {
    if (!navigationPath || navigationPath.length === 0) return groupedData || [];
    const findNodeRecursive = (nodes: any[], targetId: string): any => {
      if (!nodes) return null;
      for (const node of nodes) {
        if (node.id === targetId) return node;
        if (node.children) {
          const found = findNodeRecursive(node.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    const targetGroup = findNodeRecursive(groupedData, navigationPath[navigationPath.length - 1]);
    return targetGroup?.children || [];
  };

  useEffect(() => {
    console.log("[DASHboard] Data debug:", {
      properties: properties.length,
      tenants: tenants.length,
      receipts: receipts.length,
      customGroups: customGroups.length,
      navigationPath,
      groupedData: groupedData.length
    });
  }, [properties, tenants, receipts, customGroups, navigationPath, groupedData]);

  const revenueData = useMemo(() => {
    const year = parseInt(selectedYear);
    const months = [
      { id: 1, label: "Jan" },
      { id: 2, label: "Fév" },
      { id: 3, label: "Mar" },
      { id: 4, label: "Avr" },
      { id: 5, label: "Mai" },
      { id: 6, label: "Juin" },
      { id: 7, label: "Juil" },
      { id: 8, label: "Août" },
      { id: 9, label: "Sep" },
      { id: 10, label: "Oct" },
      { id: 11, label: "Nov" },
      { id: 12, label: "Déc" }
    ];

    const currentNodes = getCurrentNodes();

    const getReceiptForNode = (nodeId: string, tenant: any, monthId: number) => {
      if (!receipts) return null;
      return receipts.find(r => {
        const rYear = typeof r.year === 'string' ? parseInt(r.year) : r.year;
        const rMonth = typeof r.month === 'string' ? parseInt(r.month) : r.month;
        if (rYear !== year || rMonth !== monthId) return false;

        const rUnitId = (r as any).unit_id ? String((r as any).unit_id) : null;
        const targetUnitId = nodeId ? String(nodeId) : null;
        if (rUnitId && targetUnitId && rUnitId === targetUnitId) return true;

        const rTenantId = (r as any).tenant_id ? String((r as any).tenant_id) : null;
        const rUserId = (r as any).user_id ? String((r as any).user_id) : null;
        const tId = tenant?.id ? String(tenant.id) : null;
        const tUserId = tenant?.user_id ? String(tenant.user_id) : null;

        if (tId && (rTenantId === tId || rUserId === tId)) return true;
        if (tUserId && (rTenantId === tUserId || rUserId === tUserId)) return true;

        return false;
      });
    };

    const calculateMonthlyTotalRecursive = (nodes: any[], monthId: number): number => {
      let total = 0;
      nodes.forEach(n => {
        if (n.type === 'property') {
          (n.units || []).forEach(({ unit, tenant }: any) => {
            const r = getReceiptForNode(unit?.id, tenant, monthId);
            if (r) total += (typeof r.amount === 'number' ? r.amount : parseFloat(r.amount) || 0);
          });
        } else if (n.children) {
          total += calculateMonthlyTotalRecursive(n.children, monthId);
        }
      });
      return total;
    };

    return months.map(month => ({
      name: month.label,
      total: calculateMonthlyTotalRecursive(currentNodes, month.id),
    }));
  }, [receipts, selectedYear, navigationPath, groupedData]);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (user) {
      loadData();
      loadReceipts();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Marquer les messages comme lus quand un chat est sélectionné
  useEffect(() => {
    if (!selectedChat || !currentUserId || activeTab !== "messages" || !messages.length) return;

    const markMessagesAsReadLocal = async () => {
      // Trouver tous les messages non lus de ce contact (reçus par l'utilisateur actuel)
      const unreadMessages = messages.filter(
        (m) =>
          m.sender_id === selectedChat.user_id &&
          m.receiver_id === currentUserId &&
          !m.is_read
      );

      if (unreadMessages.length === 0) return;

      // Marquer tous les messages non lus comme lus
      const messageIds = unreadMessages.map((m) => m.id);
      try {
        // Mettre à jour localement immédiatement pour un effet visuel instantané
        setMessages((prev) =>
          prev.map((m) =>
            messageIds.includes(m.id) ? { ...m, is_read: true } : m
          )
        );

        await markMessagesAsRead(messageIds);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markMessagesAsReadLocal();
  }, [selectedChat, currentUserId, messages, activeTab]);

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    } else {
      setActiveTab("dashboard");
    }
  }, [urlTab]);

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return format(date, "MMMM", { locale: fr });
  };

  const { socket, connected } = useSocket();

  useEffect(() => {
    // Si on se reconnecte (ou première connexion) et qu'on est sur l'onglet messages, rafraîchir pour ne rien rater
    if (connected && activeTab === "messages") {
      console.log("[SOCKET] Reconnected! Refreshing messages...");
      loadMessagesOnly();
    }
  }, [connected, activeTab]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      console.log("[SOCKET] Received new message:", msg);
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      // Show toast if the message is from a different contact than the one currently selected
      if (!selectedChat || selectedChat.user_id !== msg.sender_id) {
        toast({
          title: "Nouveau message",
          description: `Vous avez reçu un message de ${msg.sender_name || 'un contact'}.`,
        });
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, selectedChat, toast]);

  useEffect(() => {
    if (activeTab === "messages") {
      loadMessagesOnly();
    }
    if (activeTab === "maintenance") {
      loadMaintenanceOnly();
    }

    // Garder le polling pour la maintenance car non encore en temps réel
    const interval = setInterval(() => {
      if (activeTab === "maintenance" || activeTab === "dashboard") {
        loadMaintenanceOnly();
      }
    }, 10000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeTab]);

  const loadMessagesOnly = async () => {
    try {
      if (!user) return;
      const messagesData = await getMessages();
      if (messagesData) {
        setMessages(messagesData);
      }
    } catch (error) {
      console.error("Error reloading messages:", error);
    }
  };

  const loadMaintenanceOnly = async () => {
    try {
      if (!user) return;
      const data = await getOwnerMaintenanceRequests();
      console.log("[MAINTENANCE] Fetched for owner:", data);
      if (data) {
        setMaintenanceRequests(data);
      }
    } catch (error) {
      console.error("Error reloading maintenance:", error);
    }
  };

  const loadData = async () => {
    try {
      if (!user) return;
      setCurrentUserId(user.id);

      // Fetch all data in parallel to avoid waterfall (much faster)
      console.log("[DASHBOARD] Parallel load started");
      const [
        propsData,
        tenantsData,
        messagesData,
        maintenanceData,
        profileData,
        receiptsData
      ] = await Promise.all([
        getOwnerProperties(),
        getOwnerTenants(),
        getMessages(),
        getOwnerMaintenanceRequests(),
        getOwnerProfile(),
        getOwnerReceipts()
      ]);

      // 1. Properties & Units
      const transformedProps = (propsData || []).map((p: any) => transformProperty(p));
      setProperties(transformedProps);
      const allUnits = transformedProps.flatMap((p: any) =>
        (p.property_units || []).map((unit: any) => ({
          ...unit,
          property_id: unit.property_id || p.id,
          properties: unit.properties || p,
        }))
      );
      setUnits(allUnits);

      // 2. Set individual states
      setTenants(tenantsData || []);
      setMessages(messagesData || []);
      setMaintenanceRequests(maintenanceData || []);
      setOwnerProfile(profileData);
      setReceipts(receiptsData || []);

      // 3. Stats Calculation (based on freshly fetched data)
      const occupied = allUnits.filter((u: any) => !u.is_available).length;
      setStats({
        totalProperties: (propsData || []).length,
        occupiedUnits: occupied,
        activeTenants: (tenantsData || []).filter((t: any) => t.status === 'active').length || 0,
      });

      console.log("[DASHBOARD] Parallel load complete");
      setIsInitialLoading(false);
    } catch (error: any) {
      setIsInitialLoading(false);
      toast({
        title: t('common.error'),
        description: "Une erreur est survenue lors du chargement des données.", // This specific error message was not requested for translation, keeping it as is.
        variant: "destructive",
      });
    }
  };

  const loadReceipts = async () => {
    try {
      const data = await getOwnerReceipts();
      setReceipts(data);
    } catch (error) {
      console.error("Error loading receipts:", error);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm(t('tenant.delete_confirm'))) {
      return;
    }

    try {
      await deleteTenant(tenantId);
      toast({
        title: t('tenant.delete_success'),
        description: "Le locataire a été supprimé avec succès.", // This specific error message was not requested for translation, keeping it as is.
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: "La suppression du locataire a échoué.", // This specific error message was not requested for translation, keeping it as is.
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm(t('tenant.delete_confirm'))) { // Reusing tenant.delete_confirm for message, assuming it's a generic confirmation.
      return;
    }

    try {
      await deleteMessage(messageId);

      // Rafraîchir la liste des messages
      loadMessagesOnly();

      toast({
        title: t('dashboard.common.message_deleted'),
        description: "Le message a été supprimé avec succès.", // This specific error message was not requested for translation, keeping it as is.
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: "Le message n'a pas pu être supprimé.", // This specific error message was not requested for translation, keeping it as is.
        variant: "destructive",
      });
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm(t('owner.property_delete_confirm'))) {
      return;
    }

    try {
      await deleteProperty(propertyId);
      toast({
        title: t('owner.property_deleted'),
        description: "Le bien a été supprimé avec succès.", // This specific error message was not requested for translation, keeping it as is.
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: "La suppression du bien a échoué.", // This specific error message was not requested for translation, keeping it as is.
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    if (!selectedChat.user_id) {
      toast({
        title: t('dashboard.common.tenant_account_required_title'),
        description: t('dashboard.common.tenant_account_required_desc'),
        variant: "destructive",
      });
      return;
    }

    try {
      const sentMsg = await sendMessage({
        receiver_id: selectedChat.user_id,
        message: newMessage
      });

      if (sentMsg) {
        setMessages((prev) => [...prev, sentMsg]);
      }
      setNewMessage("");
      // Note: La notification est créée automatiquement par le backend

    } catch (error: any) {
      toast({
        title: t('dashboard.common.send_failed'),
        description: "Le message n'a pas pu être envoyé.", // This specific error message was not requested for translation, keeping it as is.
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount).replace('XOF', 'F CFA');
  };

  const renderSidebarContent = (isMobile = false) => {
    const showLabels = isMobile || !isSidebarCollapsed;
    const itemAlignment = isMobile ? 'justify-start' : (isSidebarCollapsed ? 'justify-center border-r-0' : 'justify-start');

    return (
      <>
        <button
          onClick={() => {
            navigate("/");
            if (isMobile) setMobileMenuOpen(false);
          }}
          className={`flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity overflow-hidden ${isMobile ? 'justify-start' : (isSidebarCollapsed ? 'justify-center px-2' : 'justify-start')}`}
        >
          <img 
            src="/logo-sl.png" 
            alt="Logo" 
            className={`${isSidebarCollapsed ? 'h-8 w-8 object-contain' : 'h-12 w-auto object-contain'}`} 
          />
          {showLabels && (
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate hidden lg:block">
              Samalocation
            </span>
          )}
        </button>

        {/* Context Switcher for Collaborators */}
        {
          user?.parentId && (
            <div className={`flex flex-col gap-2 mb-6 p-2 rounded-2xl bg-secondary/30 ${isSidebarCollapsed ? 'items-center' : 'items-stretch'}`}>
              <button
                onClick={() => switchContext("personal")}
                title="Compte Personnel"
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${activeContext === "personal"
                  ? "bg-white text-primary shadow-soft font-bold"
                  : "text-muted-foreground hover:bg-white/50"
                  }`}
              >
                <UserIcon className="h-4 w-4 shrink-0" />
                {showLabels && <span className="text-sm">Personnel</span>}
              </button>
              <button
                onClick={() => switchContext(user.parentId!)}
                title="Compte Entreprise"
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${activeContext !== "personal"
                  ? "bg-primary text-white shadow-medium font-bold"
                  : "text-primary hover:bg-white/50"
                  }`}
              >
                <Briefcase className="h-4 w-4 shrink-0" />
                {showLabels && <span className="text-sm">Entreprise</span>}
              </button>
            </div>
          )
        }

        <nav className="space-y-2">
          {[
            { id: "dashboard", label: t('dashboard.sidebar.home'), icon: TrendingUp },
            { id: "properties", label: t('dashboard.sidebar.properties'), icon: Building2 },
            { id: "tenants", label: t('dashboard.sidebar.tenants'), icon: Users },
            { id: "management", label: t('dashboard.sidebar.management'), icon: PieChart },
            { id: "maintenance", label: t('dashboard.sidebar.maintenance'), icon: Wrench },
            { id: "messages", label: t('dashboard.sidebar.messages'), icon: MessageSquare },
            { id: "public-profile", label: "Profil Public", icon: Globe },
            { id: "contracts", label: t('dashboard.sidebar.contracts'), icon: FileText },
            { id: "subscription", label: t('dashboard.sidebar.subscription'), icon: CreditCard },
            { id: "team", label: "Équipe", icon: Users2 },
            { id: "settings", label: t('dashboard.sidebar.settings'), icon: Settings },
          ].filter(item => {
            // Collaborators (with parentId) shouldn't manage the team or billing
            if (user?.parentId && (item.id === "team" || item.id === "subscription")) return false;
            return true;
          }).map((item) => {
            const unreadCount =
              item.id === "messages"
                ? messages.filter(
                  (msg) => msg.receiver_id === user?.id && !msg.is_read
                ).length
                : item.id === "maintenance"
                  ? maintenanceRequests.filter(
                    (req) => req.status === 'pending'
                  ).length
                  : 0;

            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(`/owner-dashboard/${item.id}`);
                  if (isMobile) setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative group/nav ${activeTab === item.id
                  ? "bg-primary text-white"
                  : "hover:bg-secondary text-muted-foreground"
                  } ${itemAlignment}`}
                title={!showLabels ? item.label : ""}
              >
                <div
                  className={`flex items-center gap-3 w-full ${isMobile
                    ? "justify-start"
                    : isSidebarCollapsed
                      ? "justify-center"
                      : "justify-start"
                    }`}
                >
                  <item.icon className={`h-5 w-5 shrink-0`} />
                  {showLabels && <span className="truncate">{item.label}</span>}
                </div>
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className={`${!showLabels
                      ? "absolute -top-1 -right-1 h-4 min-w-[16px] text-[10px]"
                      : "h-5 min-w-[20px] text-xs"
                      } flex items-center justify-center px-1.5`}
                  >
                    {unreadCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <Button
          variant="ghost"
          onClick={signOut}
          className={`w-full mt-8 text-muted-foreground transition-all duration-200 ${isMobile
            ? "justify-start px-4"
            : isSidebarCollapsed
              ? "justify-center px-0"
              : "justify-start px-4"
            }`}
          title={!showLabels ? t('dashboard.sidebar.logout') : ""}
        >
          <LogOut className={`h-5 w-5 shrink-0 ${!showLabels ? "" : "mr-3"}`} />
          {showLabels && <span>{t('dashboard.sidebar.logout')}</span>}
        </Button>
      </>
    );
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`${isSidebarCollapsed ? "w-16" : "w-64"
          } bg-card border-r shadow-soft hidden md:block transition-all duration-300 relative h-screen sticky top-0 overflow-y-auto overflow-x-hidden scrollbar-none`}
      >
        <div
          className={`transition-all duration-300 ${isSidebarCollapsed ? "p-3" : "p-6"
            }`}
        >
          {renderSidebarContent(false)}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-card border rounded-full flex items-center justify-center shadow-md hover:bg-secondary transition-colors z-50"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b">
          <div
            className={`${activeTab === "management" ? "max-w-full" : "max-w-7xl"
              } mx-auto px-4 md:px-8 py-4 flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="md:hidden h-12 w-12"
                  >
                    <Menu className="h-7 w-7" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] sm:w-72 p-0 border-r-0">
                  <div className="p-6 h-full bg-card overflow-y-auto">
                    {renderSidebarContent(true)}
                  </div>
                </SheetContent>
              </Sheet>
              <h2 className="text-xl font-bold md:hidden truncate max-w-[150px]">
                {activeTab === "dashboard"
                  ? "Dashboard"
                  : activeTab === "properties"
                    ? "Mes logements"
                    : activeTab === "tenants"
                      ? "Locataires"
                      : activeTab === "management"
                        ? "Gérance"
                        : activeTab === "maintenance"
                          ? "Maintenance"
                          : activeTab === "messages"
                            ? "Messages"
                            : activeTab === "contracts"
                              ? "Contrats"
                              : activeTab === "subscription"
                                ? "Abonnement"
                                : activeTab === "team"
                                  ? "Équipe"
                                  : "Paramètres"}
              </h2>
            </div>

            {/* Right Side - Theme, Notifications & User Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <NotificationBell />
              <UserProfile onSettingsClick={() => setActiveTab("settings")} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div
            className={`${activeTab === "management" ? "max-w-full" : "max-w-7xl"
              } mx-auto`}
          >

            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {!isInitialLoading && (
                  <OnboardingChecklist
                    stats={stats}
                    ownerProfile={ownerProfile}
                    onAction={setActiveTab}
                    onAddProperty={() => setAddPropertyOpen(true)}
                  />
                )}

                {/* Subscription Status Messages */}
                {subscription && subscription.plan_name !== 'gratuit' && subscription.plan_name !== 'FREE' && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    {subscription.status === 'active' ? (() => {
                      const now = new Date().getTime();
                      const expiry = subscription.expires_at ? new Date(subscription.expires_at).getTime() : 0;
                      const diffInDays = expiry - now;
                      const isExpiringSoon = expiry > 0 && diffInDays < (7 * 24 * 60 * 60 * 1000) && diffInDays > 0;
                      const isGracePeriod = expiry > 0 && diffInDays < 0 && diffInDays > -(3 * 24 * 60 * 60 * 1000);

                      return (
                        <Alert className={isGracePeriod
                          ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400 flex items-center gap-4 py-5 rounded-2xl shadow-md border-2 animate-pulse"
                          : isExpiringSoon 
                            ? "bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400 flex items-center gap-4 py-4 rounded-2xl shadow-sm"
                            : "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400 flex items-center gap-4 py-4 rounded-2xl shadow-sm"
                        }>
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isGracePeriod ? 'bg-red-500/20' : isExpiringSoon ? 'bg-orange-500/20' : 'bg-green-500/20'}`}>
                            {isGracePeriod 
                              ? <History className="h-6 w-6 text-red-600" />
                              : isExpiringSoon 
                                ? <AlertTriangle className="h-6 w-6 text-orange-600" />
                                : <CheckCircle2 className="h-6 w-6 text-green-600" />
                            }
                          </div>
                          <div className="flex-1">
                            <AlertTitle className="font-bold text-base">
                              {isGracePeriod 
                                ? "Action requise : Abonnement expiré !" 
                                : isExpiringSoon 
                                  ? "Votre abonnement expire bientôt !" 
                                  : (subscription.price === 0 ? "Récompense de parrainage activée !" : "Paiement validé avec succès !")
                              }
                            </AlertTitle>
                            <AlertDescription className="text-sm opacity-90">
                              {isGracePeriod 
                                ? `Votre plan ${subscription.plan_name} est terminé, mais Samalocation vous offre 3 jours de sursis pour régulariser. Profitez-en pour renouveler dès maintenant.`
                                : isExpiringSoon 
                                  ? `Attention, votre accès ${subscription.plan_name} se termine dans quelques jours.`
                                  : (subscription.price === 0 
                                      ? `Félicitations ! Vous profitez de ${subscription.referral_count} mois de plan ${subscription.plan_name} offerts grâce à vos parrainages.`
                                      : `Votre abonnement ${subscription.plan_name} est actif.`)
                              }
                              {subscription.expires_at && (
                                <span> {isGracePeriod ? "Était valide jusqu'au" : "Fin de l'offre"} : <strong>{format(new Date(subscription.expires_at), 'dd MMMM yyyy', { locale: fr })}</strong>.</span>
                              )}
                            </AlertDescription>
                          </div>
                          {(isExpiringSoon || isGracePeriod) && (
                            <Button 
                              size="sm" 
                              variant={isGracePeriod ? "default" : "outline"}
                              className={isGracePeriod 
                                ? "bg-red-600 hover:bg-red-700 text-white font-black px-6 shadow-lg h-12" 
                                : "border-orange-500/30 hover:bg-orange-500/10 text-orange-700 dark:text-orange-400 font-bold"}
                              onClick={() => setActiveTab('subscription')}
                            >
                              {isGracePeriod ? "RENOUVELER MAINTENANT" : "Renouveler"}
                            </Button>
                          )}
                        </Alert>
                      );
                    })() : subscription.status === 'pending' ? (
                      <Alert className="bg-amber-500/10 border-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center gap-4 py-4 rounded-2xl shadow-sm">
                        <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                          <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTitle className="font-bold text-base mb-0 leading-none">Paiement en vérification</AlertTitle>
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-600/30 text-[10px] h-5">Validé (Provisoire)</Badge>
                          </div>
                          <AlertDescription className="text-sm opacity-90 leading-tight">
                            Votre demande pour le plan <strong>{subscription.plan_name}</strong> est enregistrée.
                            Il sera validé officiellement sous 24h, mais <strong>vous profitez déjà de toutes les fonctionnalités</strong> du plan !
                          </AlertDescription>
                        </div>
                      </Alert>
                    ) : subscription.status === 'rejected' ? (
                      <Alert className="bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400 flex items-center gap-4 py-4 rounded-2xl shadow-sm">
                        <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                          <X className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <AlertTitle className="font-bold text-base">Demande refusée</AlertTitle>
                          <AlertDescription className="text-sm opacity-90">
                            Votre demande pour le plan <strong>{subscription.plan_name}</strong> n'a pas pu être validée.
                            {subscription.admin_notes ? (
                              <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/20 italic">
                                <strong>Raison :</strong> {subscription.admin_notes}
                              </div>
                            ) : (
                              " Veuillez vérifier vos informations ou contacter le support."
                            )}
                          </AlertDescription>
                        </div>
                      </Alert>
                    ) : null}
                  </div>
                )}

                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h1 className="text-xl md:text-3xl font-bold">
                      {t('dashboard.sidebar.home')}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-[12px] sm:text-sm text-muted-foreground">
                        {t('dashboard.common.welcome')}, {ownerProfile?.company_name || ownerProfile?.full_name || user?.name || "Propriétaire"}
                      </p>
                      {user?.customId && (
                        <Badge
                          variant="outline"
                          className="text-[10px] sm:text-xs text-primary font-mono font-bold px-1.5 py-0"
                        >
                          ID: {user.customId}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-2 ml-auto">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-[85px] sm:w-[120px] h-9 sm:h-10 bg-background">
                        <SelectValue placeholder="Année" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="gradient-accent text-white h-11 sm:h-10 px-4 sm:px-4"
                      onClick={() => setAddPropertyOpen(true)}
                    >
                      <Plus className="mr-1 sm:mr-2 h-5 w-5" />
                      <span className="hidden xs:inline">{t('owner.add_property')}</span>
                      <span className="xs:hidden">Ajouter un logement</span>
                    </Button>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  <Card className="shadow-soft hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
                      <CardTitle className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('owner.stats.total_properties')}
                      </CardTitle>
                      <Building2 className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl sm:text-3xl font-bold">{stats.totalProperties}</div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-soft hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
                      <CardTitle className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('owner.stats.occupied_units')}
                      </CardTitle>
                      <Home className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl sm:text-3xl font-bold">{stats.occupiedUnits}</div>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                        {units.length > 0 ? Math.round((stats.occupiedUnits / units.length) * 100) : 0}% {t('owner.stats.occupancy_rate')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-soft hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
                      <CardTitle className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {t('owner.stats.active_tenants')}
                      </CardTitle>
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl sm:text-3xl font-bold">{stats.activeTenants}</div>
                    </CardContent>
                  </Card>

                  {canSeeRevenue && (
                    <Card className="shadow-soft hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2">
                        <CardTitle className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t('owner.stats.total_revenue')}
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl sm:text-3xl font-bold truncate">
                          {totalYearlyRevenue.toLocaleString()} F
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                          Pour {selectedYear}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Activity */}
                  <Card className="lg:col-span-2 shadow-soft">
                    <CardHeader>
                      <CardTitle>{t('dashboard.common.recent_activity')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {receipts.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            {t('dashboard.common.no_activity')}
                          </div>
                        ) : (
                          receipts.slice(0, 5).map((activity: any) => (
                            <div key={activity.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{t('owner.stats.payment_received')}</p>
                                  <p className="text-sm text-muted-foreground">{activity.tenant_name} - {activity.property_name}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-primary">{activity.amount.toLocaleString()} F</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(activity.payment_date), 'dd MMM yyyy', { locale: dateLocale })}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Revenue Growth Chart */}
                  {canSeeRevenue && (
                    <Card className="shadow-soft">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold">
                          {t('owner.stats.revenue_growth')} ({selectedYear})
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px] w-full mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={revenueData}
                              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient
                                  id="colorTotal"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="hsl(var(--primary))"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="hsl(var(--primary))"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="hsl(var(--muted))"
                              />
                              <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                  fontSize: 10,
                                  fill: "hsl(var(--muted-foreground))",
                                }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value: number) =>
                                  `${(value / 1000).toFixed(0)}k`
                                }
                                tick={{
                                  fontSize: 10,
                                  fill: "hsl(var(--muted-foreground))",
                                }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--card))",
                                  borderColor: "hsl(var(--border))",
                                  borderRadius: "8px",
                                }}
                                formatter={(value: number) => [
                                  `${value.toLocaleString()} FCFA`,
                                  t('owner.stats.total_revenue'),
                                ]}
                              />
                              <Area
                                type="monotone"
                                dataKey="total"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Properties Tab */}
            {activeTab === "properties" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">{t('dashboard.sidebar.properties')}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {properties.length} {properties.length > 1 ? t('owner.properties_registered') : t('owner.property_registered')}
                    </p>
                  </div>
                  <Button
                    onClick={() => setAddPropertyOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('owner.add_property')}
                  </Button>
                </div>

                {properties.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">
                        {t('owner.no_properties')}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {t('owner.no_properties_desc')}
                      </p>
                      <Button
                        onClick={() => setAddPropertyOpen(true)}
                        className="gradient-accent text-white"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t('owner.add_first_property')}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => {
                      const photoUrl =
                        property.photos && property.photos.length > 0
                          ? property.photos[0]
                          : property.photo_url;

                      return (
                        <Card
                          key={property.id}
                          className="shadow-soft hover:shadow-medium transition-shadow overflow-hidden"
                        >
                          {photoUrl && (
                            <div className="h-48 overflow-hidden relative group">
                              <img
                                src={photoUrl}
                                alt={property.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {property.photos && property.photos.length > 1 && (
                                <Badge className="absolute top-2 right-2 bg-black/60 text-white">
                                  +{property.photos.length - 1} {t('common.photos')}
                                </Badge>
                              )}
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>{property.name}</span>
                              <Badge>{property.property_type}</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-2">
                              {property.address}
                            </p>
                            {property.description && (
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {property.description}
                              </p>
                            )}
                            {/* Afficher le numéro du propriétaire */}
                            {(() => {
                              const ownerProfile = property.owner_profiles
                                ? Array.isArray(property.owner_profiles)
                                  ? property.owner_profiles[0]
                                  : property.owner_profiles
                                : null;
                              const ownerPhone =
                                ownerProfile?.contact_phone || ownerProfile?.phone;
                              return ownerPhone ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                  <Phone className="h-4 w-4" />
                                  <span>{ownerPhone}</span>
                                </div>
                              ) : null;
                            })()}
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span>{t('owner.total_units')}:</span>
                                <span className="font-semibold">
                                  {property.property_units?.length || 0}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>{t('owner.available_units')}:</span>
                                <span className="font-semibold text-green-600">
                                  {property.property_units?.filter(
                                    (u) => u.is_available
                                  ).length || 0}
                                </span>
                              </div>
                              {property.property_type === "maison" &&
                                property.property_units &&
                                property.property_units.length > 0 && (
                                  <div className="mt-2 pt-2 border-t">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {t('owner.unit_types')}:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {Array.from(
                                        new Set(
                                          property.property_units.map(
                                            (u) => u.unit_type
                                          )
                                        )
                                      ).map((type) => {
                                        const count =
                                          property.property_units.filter(
                                            (u) => u.unit_type === type
                                          ).length;
                                        return (
                                          <Badge
                                            key={type}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {count} {type}
                                            {count > 1 ? "s" : ""}
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                              <div className="flex items-center gap-2">
                                {property.is_published ? (
                                  <Badge variant="default" className="bg-green-600">
                                    {t('owner.published')}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="bg-orange-100 text-orange-800"
                                  >
                                    {t('owner.draft')}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant={property.is_published ? "outline" : "default"}
                                onClick={async () => {
                                  try {
                                    await togglePropertyPublication(property.id);

                                    toast({
                                      title: property.is_published
                                        ? t('owner.property_unpublished')
                                        : t('owner.property_published'),
                                      description: property.is_published
                                        ? t('owner.property_unpublished_desc')
                                        : t('owner.property_published_desc'),
                                    });

                                    await loadData();
                                  } catch (error) {
                                    toast({
                                      title: t('common.error'),
                                      description: error.message,
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                {property.is_published ? t('owner.unpublish') : t('owner.publish')}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedPropertyForEdit(property);
                                  setEditPropertyOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => handleDeleteProperty(property.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tenants Tab */}
            {activeTab === "tenants" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">{t('dashboard.sidebar.tenants')}</h2>
                    <p className="text-sm text-muted-foreground">
                      {tenants.length} {tenants.length > 1 ? t('owner.tenants_registered') : t('owner.tenant_registered')}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Input
                        placeholder={t('owner.search_tenant')}
                        value={tenantSearch}
                        onChange={(e) => setTenantSearch(e.target.value)}
                        className="pl-3 py-1 text-sm h-9"
                      />
                    </div>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => setAssignTenantOpen(true)}
                      disabled={properties.length === 0}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('owner.assign_tenant')}
                    </Button>
                  </div>
                </div>

                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle>{t('owner.tenants_list')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const filteredTenants = tenants.filter(
                        (t) =>
                          t.full_name
                            .toLowerCase()
                            .includes(tenantSearch.toLowerCase()) ||
                          t.email
                            .toLowerCase()
                            .includes(tenantSearch.toLowerCase()) ||
                          (t.property_name || "")
                            .toLowerCase()
                            .includes(tenantSearch.toLowerCase())
                      );

                      if (filteredTenants.length === 0) {
                        return (
                          <p className="text-center text-muted-foreground py-8">
                            {tenantSearch
                              ? t('owner.no_tenant_found')
                              : t('owner.no_tenants')}
                          </p>
                        );
                      }

                      return (
                        <>
                          {/* Mobile Card View */}
                          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredTenants.map((tenant) => (
                              <Card
                                key={`mobile-tenant-${tenant.id}`}
                                className="p-5 border shadow-soft hover:shadow-md transition-shadow relative overflow-hidden"
                              >
                                <div className="flex justify-between items-start mb-4">
                                  <div className="space-y-1 pr-16">
                                    <h3 className="font-bold text-lg leading-tight">
                                      {tenant.full_name}
                                    </h3>
                                    <p className="text-sm font-medium text-primary line-clamp-1">
                                      {tenant.property_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground bg-secondary/50 w-fit px-2 py-0.5 rounded">
                                      {tenant.unit_number || t('common.unit')}
                                    </p>
                                  </div>
                                  <Badge
                                    variant={tenant.status === "active" ? "default" : "secondary"}
                                    className="absolute top-5 right-5"
                                  >
                                    {tenant.status === "active" ? t('common.active') : t('common.inactive')}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-5">
                                  <div className="bg-primary/5 border border-primary/10 p-2.5 rounded-xl">
                                    <span className="text-[10px] text-primary/70 uppercase font-bold tracking-wider block mb-0.5">
                                      {t('common.rent')}
                                    </span>
                                    <span className="font-bold text-sm sm:text-base">
                                      {formatCurrency(tenant.monthly_rent)}
                                    </span>
                                  </div>
                                  <div className="bg-secondary/30 border border-secondary p-2.5 rounded-xl">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-0.5">
                                      {t('common.contact')}
                                    </span>
                                    <span className="truncate block text-xs font-medium">
                                      {tenant.phone || tenant.email}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-4 border-t border-dashed">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1 h-9 text-xs"
                                    onClick={() => {
                                      setSelectedChat(tenant);
                                      setActiveTab("messages");
                                    }}
                                  >
                                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                                    Chat
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-9 text-xs"
                                    onClick={() => {
                                      setSelectedPropertyForReceipt(tenant);
                                      setCreateReceiptOpen(true);
                                    }}
                                  >
                                    {t('common.receipt')}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-9 text-xs"
                                    onClick={() => {
                                      setSelectedTenantForContract(tenant);
                                      setCreateContractOpen(true);
                                    }}
                                  >
                                    Bail
                                  </Button>
                                  <div className="flex gap-2 w-full mt-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="flex-1 h-9 text-xs border bg-background"
                                      onClick={() => {
                                        setSelectedTenantForHistory(tenant);
                                        setHistoryDialogOpen(true);
                                      }}
                                    >
                                      <History className="h-3.5 w-3.5 mr-1.5" />
                                      Historique
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 border"
                                      onClick={() => handleDeleteTenant(tenant.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>

                          {/* Desktop Table View */}
                          <div className="hidden md:block overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t('common.name')}</TableHead>
                                  <TableHead>{t('common.contact')}</TableHead>
                                  <TableHead>{t('common.property')}</TableHead>
                                  <TableHead>{t('common.monthly_rent')}</TableHead>
                                  <TableHead>{t('common.status')}</TableHead>
                                  <TableHead>{t('common.actions')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredTenants.map((tenant) => (
                                  <TableRow key={tenant.id}>
                                    <TableCell className="font-medium">
                                      {tenant.full_name}
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm">
                                        <div>{tenant.email}</div>
                                        <div className="text-muted-foreground">
                                          {tenant.phone}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>{tenant.property_name}</TableCell>
                                    <TableCell>
                                      {formatCurrency(tenant.monthly_rent)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          tenant.status === "active"
                                            ? "default"
                                            : "secondary"
                                        }
                                      >
                                        {tenant.status === "active"
                                          ? t('common.active')
                                          : t('common.inactive')}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedChat(tenant);
                                            setActiveTab("messages");
                                          }}
                                        >
                                          <MessageSquare className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedPropertyForReceipt(tenant);
                                            setCreateReceiptOpen(true);
                                          }}
                                        >
                                          {t('common.receipt')}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedTenantForHistory(tenant);
                                            setHistoryDialogOpen(true);
                                          }}
                                        >
                                          <History className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedTenantForContract(tenant);
                                            setCreateContractOpen(true);
                                          }}
                                          title="Contrat de bail"
                                        >
                                          <FileText className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => handleDeleteTenant(tenant.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === "messages" && (
              <div className="space-y-6 h-full">
                <h2 className={`text-2xl font-bold ${selectedChat ? "hidden lg:block" : ""}`}>
                  {t('dashboard.sidebar.messages')}
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] lg:h-auto">
                  {/* Contacts List */}
                  <Card
                    className={`lg:col-span-1 h-full ${selectedChat ? "hidden lg:block" : "block"
                      }`}
                  >
                    <CardHeader>
                      <CardTitle>{t('owner.conversations')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[500px]">
                        {(() => {
                          const currentUserId = user?.id;
                          if (!currentUserId) return null;

                          // Create a unique list of contacts
                          const contacts = new Map();
                          const lastMessageTime = new Map();
                          const unreadCount = new Map();

                          // Add existing tenants
                          tenants.forEach((tenant) => {
                            if (tenant.user_id) {
                              contacts.set(tenant.user_id, {
                                id: tenant.id,
                                user_id: tenant.user_id,
                                full_name: tenant.full_name,
                                email: tenant.email,
                                subtitle: `${tenant.property_name} - ${tenant.unit_number}`,
                                type: "tenant",
                              });
                            }
                          });

                          // Add people who sent messages
                          messages.forEach((msg) => {
                            const otherUserId =
                              msg.sender_id === currentUserId
                                ? msg.receiver_id
                                : msg.sender_id;

                            if (otherUserId) {
                              // Update last message time
                              const msgTime = new Date(msg.created_at).getTime();
                              if (!lastMessageTime.has(otherUserId) || msgTime > lastMessageTime.get(otherUserId)) {
                                lastMessageTime.set(otherUserId, msgTime);
                              }

                              // Update unread count
                              if (msg.receiver_id === currentUserId && !msg.is_read) {
                                unreadCount.set(otherUserId, (unreadCount.get(otherUserId) || 0) + 1);
                              }

                              if (!contacts.has(otherUserId)) {
                                contacts.set(otherUserId, {
                                  id: `contact_${otherUserId}`,
                                  user_id: otherUserId,
                                  full_name: msg.sender_id === currentUserId ? (msg.receiver_name || t('owner.tenant')) : (msg.sender_name || t('owner.tenant')),
                                  email: "",
                                  subtitle: t('owner.tenant'),
                                  type: "tenant",
                                });
                              }
                            }
                          });

                          const contactsList = Array.from(contacts.values())
                            .map(c => ({
                              ...c,
                              unreadCount: unreadCount.get(c.user_id) || 0,
                              lastTime: lastMessageTime.get(c.user_id) || 0
                            }))
                            .sort((a, b) => b.lastTime - a.lastTime);

                          return contactsList.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8 px-4">{t('dashboard.common.no_conversations')}</p>
                          ) : (
                            contactsList.map((contact) => (
                              <div
                                key={contact.id}
                                className={`p-4 cursor-pointer hover:bg-secondary transition-colors border-b ${selectedChat?.user_id === contact.user_id ? "bg-secondary" : ""
                                  }`}
                                onClick={async () => {
                                  setSelectedChat(contact);

                                  const unreadMsgIds = messages
                                    .filter(m => m.sender_id === contact.user_id && m.receiver_id === currentUserId && !m.is_read)
                                    .map(m => m.id);

                                  if (unreadMsgIds.length > 0) {
                                    try {
                                      await markMessagesAsRead(unreadMsgIds);
                                      setMessages(prev => prev.map(m =>
                                        unreadMsgIds.includes(m.id) ? { ...m, is_read: true } : m
                                      ));
                                    } catch (error) {
                                      console.error("Error marking messages as read:", error);
                                    }
                                  }
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback>{contact.full_name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="font-medium truncate">{contact.full_name}</p>
                                      {contact.unreadCount > 0 && (
                                        <Badge
                                          variant="destructive"
                                          className="h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs"
                                        >
                                          {contact.unreadCount}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {contact.subtitle}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          );
                        })()}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Chat Zone */}
                  <Card className={`lg:col-span-2 h-full flex flex-col ${!selectedChat ? 'hidden lg:block' : 'block'}`}>
                    {selectedChat ? (
                      <>
                        <CardHeader className="border-b py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="lg:hidden"
                              onClick={() => setSelectedChat(null)}
                            >
                              <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>{selectedChat.full_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle>{selectedChat.full_name}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {selectedChat.email || ""}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col">
                          <ScrollArea className="flex-1 p-4 h-[400px]">
                            {(() => {
                              const currentUserId = user?.id;
                              if (!currentUserId) return null;

                              const filteredMessages = messages.filter(
                                (m) =>
                                  (m.sender_id === currentUserId || m.receiver_id === currentUserId) &&
                                  (m.sender_id === selectedChat.user_id || m.receiver_id === selectedChat.user_id)
                              );

                              if (filteredMessages.length === 0) {
                                return (
                                  <p className="text-center text-muted-foreground py-8">
                                    {t('dashboard.common.no_messages')}
                                  </p>
                                );
                              }

                              return filteredMessages.map((message) => {
                                const isFromOther = message.sender_id === selectedChat.user_id;

                                return (
                                  <div
                                    key={message.id}
                                    className={`mb-4 flex group ${isFromOther ? "justify-start" : "justify-end"
                                      }`}
                                  >
                                    <div className="flex items-start gap-2 max-w-[80%]">
                                      <div
                                        className={`rounded-lg p-3 ${isFromOther
                                          ? "bg-secondary"
                                          : "bg-primary text-white"
                                          }`}
                                      >
                                        <p className="text-sm">{message.message}</p>
                                        <p className="text-[10px] opacity-70 mt-1">
                                          {format(new Date(message.created_at), 'p', { locale: dateLocale })}
                                        </p>
                                      </div>
                                      {!isFromOther && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => handleDeleteMessage(message.id)}
                                        >
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                            <div ref={messagesEndRef} />
                          </ScrollArea>
                          <div className="p-4 border-t">
                            <div className="flex gap-2">
                              <Input
                                placeholder={t('dashboard.common.type_message')}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                              />
                              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <CardContent className="flex items-center justify-center h-[500px]">
                        <div className="text-center text-muted-foreground">
                          <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                          <p>{t('dashboard.common.select_chat')}</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              </div>
            )}

            {/* Gérance Tab */}
            {activeTab === "management" && (
              <div className="space-y-6">
                <ManagementTable
                  tenants={tenants}
                  receipts={receipts}
                  properties={properties}
                  onDeleteTenant={handleDeleteTenant}
                  selectedYear={selectedYear}
                  onYearChange={setSelectedYear}
                  navigationPath={navigationPath}
                  onNavigationChange={setNavigationPath}
                  customGroups={customGroups}
                  onGroupsChange={setCustomGroups}
                  groupedData={groupedData}
                  years={years}
                />
              </div>
            )}

            {/* Maintenance Request Tab */}
            {activeTab === "maintenance" && (
              <div className="space-y-6">
                <OwnerMaintenanceTab />
              </div>
            )}

            {/* Contracts Tab */}
            {activeTab === "contracts" && <OwnerContractsTab />}

            {/* Subscription Tab */}
            {activeTab === "subscription" && <OwnerSubscription />}

            {/* Team Tab */}
            {activeTab === "team" && <OwnerTeamTab />}

            {/* Settings Tab */}
            {activeTab === "settings" && <OwnerSettings />}

            {/* Public Profile Tab */}
            {activeTab === "public-profile" && <OwnerPublicProfileEditor />}
          </div>
        </div>
      </main>

      <AssignTenantDialog
        open={assignTenantOpen}
        onOpenChange={setAssignTenantOpen}
        properties={properties}
        units={units}
        onSuccess={loadData}
      />

      <AddPropertyModal
        open={addPropertyOpen}
        onOpenChange={setAddPropertyOpen}
        onSuccess={loadData}
      />

      <EditPropertyModal
        open={editPropertyOpen}
        onOpenChange={setEditPropertyOpen}
        onSuccess={loadData}
        property={selectedPropertyForEdit}
      />

      {selectedPropertyForReceipt && (
        <CreateReceiptDialog
          open={createReceiptOpen}
          onOpenChange={setCreateReceiptOpen}
          propertyId={selectedPropertyForReceipt.property_id}
          propertyName={selectedPropertyForReceipt.property_name || t('common.property')}
          tenantId={selectedPropertyForReceipt.user_id}
          tenantName={selectedPropertyForReceipt.full_name}
          monthlyRent={selectedPropertyForReceipt.monthly_rent}
          receipts={receipts}
          onSuccess={() => {
            loadReceipts();
            setCreateReceiptOpen(false);
          }}
        />
      )}

      <EditTenantDialog
        open={editTenantOpen}
        onOpenChange={setEditTenantOpen}
        tenant={editingTenant}
        onSuccess={loadData}
      />

      <TenantHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        tenant={selectedTenantForHistory}
        receipts={receipts}
      />

      {selectedTenantForContract && (
        <CreateContractDialog
          open={createContractOpen}
          onOpenChange={setCreateContractOpen}
          propertyId={selectedTenantForContract.property_id}
          propertyName={selectedTenantForContract.property_name || ""}
          tenantId={selectedTenantForContract.user_id}
          tenantName={selectedTenantForContract.full_name}
          monthlyRent={selectedTenantForContract.monthly_rent}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

export default DashboardProprietaire;
