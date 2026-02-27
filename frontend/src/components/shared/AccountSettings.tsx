import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
import { baseClient } from "@/api/baseClient";
import { useTranslation } from "react-i18next";

export const AccountSettings = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('settings.fill_all_fields'),
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('settings.password_mismatch'),
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: t('common.error'),
        description: t('settings.password_length'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await baseClient("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      toast({
        title: t('settings.password_changed'),
        description: t('common.save_success'),
      });

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('common.save_error'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          {t('settings.change_password')}
        </CardTitle>
        <CardDescription>
          {t('settings.change_password_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">{t('settings.current_password')}</Label>
          <Input
            id="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            placeholder={t('settings.current_password')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t('settings.new_password')}</Label>
          <Input
            id="newPassword"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            placeholder={t('settings.password_placeholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('settings.confirm_password')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            placeholder={t('settings.confirm_placeholder')}
          />
        </div>
        <Button onClick={handleChangePassword} disabled={loading}>
          {loading ? t('common.loading') : t('settings.change_password')}
        </Button>
      </CardContent>
    </Card>
  );
};
