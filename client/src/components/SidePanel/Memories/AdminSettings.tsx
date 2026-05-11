import { Permissions, PermissionTypes, SystemRoles } from 'librechat-data-provider';
import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  OGDialog,
  OGDialogContent,
  OGDialogTitle,
  OGDialogTrigger,
  Switch,
  useToastContext,
} from '@librechat/client';
import { ShieldEllipsis } from 'lucide-react';
import { AdminSettingsDialog } from '~/components/ui';
import {
  useGetUserQuery,
  useUpdateMemoryPermissionsMutation,
  useUpdateMemoryPreferencesMutation,
} from '~/data-provider';
import { useLocalize } from '~/hooks';
import type { PermissionConfig } from '~/components/ui';

const permissions: PermissionConfig[] = [
  { permission: Permissions.USE, labelKey: 'com_ui_memories_allow_use' },
  { permission: Permissions.CREATE, labelKey: 'com_ui_memories_allow_create' },
  { permission: Permissions.UPDATE, labelKey: 'com_ui_memories_allow_update' },
  { permission: Permissions.READ, labelKey: 'com_ui_memories_allow_read' },
  { permission: Permissions.OPT_OUT, labelKey: 'com_ui_memories_allow_opt_out' },
];

const AdminSettings = () => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const { data: userData } = useGetUserQuery();

  const [compactionEnabled, setCompactionEnabled] = useState(true);
  const [compactionRatio, setCompactionRatio] = useState('0.9');
  const [summaryChars, setSummaryChars] = useState('280');

  const mutation = useUpdateMemoryPermissionsMutation({
    onSuccess: () => {
      showToast({ status: 'success', message: localize('com_ui_saved') });
    },
    onError: () => {
      showToast({ status: 'error', message: localize('com_ui_error_save_admin_settings') });
    },
  });

  const preferencesMutation = useUpdateMemoryPreferencesMutation({
    onSuccess: () => {
      showToast({ status: 'success', message: localize('com_ui_saved') });
    },
    onError: () => {
      showToast({ status: 'error', message: localize('com_ui_error_save_admin_settings') });
    },
  });

  useEffect(() => {
    const personalization = userData?.personalization;
    if (!personalization) {
      return;
    }

    setCompactionEnabled(personalization.memoryCompactionEnabled ?? true);
    setCompactionRatio(String(personalization.memoryCompactionTargetRatio ?? 0.9));
    setSummaryChars(String(personalization.memoryCompactionSummaryChars ?? 280));
  }, [userData?.personalization]);

  const onSaveCompaction = () => {
    const ratioNum = Number(compactionRatio);
    const charsNum = Number(summaryChars);

    if (!Number.isFinite(ratioNum) || ratioNum < 0.5 || ratioNum > 1) {
      showToast({
        status: 'error',
        message: localize('com_ui_memories_compaction_ratio_validation'),
      });
      return;
    }

    if (!Number.isInteger(charsNum) || charsNum < 100 || charsNum > 1000) {
      showToast({
        status: 'error',
        message: localize('com_ui_memories_compaction_chars_validation'),
      });
      return;
    }

    preferencesMutation.mutate({
      memoryCompactionEnabled: compactionEnabled,
      memoryCompactionTargetRatio: ratioNum,
      memoryCompactionSummaryChars: charsNum,
    });
  };

  if (userData?.role !== SystemRoles.ADMIN) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <AdminSettingsDialog
        permissionType={PermissionTypes.MEMORIES}
        sectionKey="com_ui_memories"
        permissions={permissions}
        menuId="memory-role-dropdown"
        mutation={mutation}
      />

      <OGDialog>
        <OGDialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="relative h-9 w-full gap-2 rounded-lg border-border-light font-medium"
            aria-label={localize('com_ui_memories_compaction')}
          >
            <ShieldEllipsis className="size-5" />
            {localize('com_ui_memories_compaction')}
          </Button>
        </OGDialogTrigger>
        <OGDialogContent className="w-11/12 max-w-lg border-border-light bg-surface-primary text-text-primary">
          <OGDialogTitle>{localize('com_ui_memories_compaction')}</OGDialogTitle>
          <div className="space-y-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-text-primary">
                {localize('com_ui_memories_compaction_enabled')}
              </div>
              <Switch checked={compactionEnabled} onCheckedChange={setCompactionEnabled} />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-text-primary" htmlFor="memory-compaction-ratio">
                {localize('com_ui_memories_compaction_ratio')}
              </label>
              <Input
                id="memory-compaction-ratio"
                type="number"
                step="0.05"
                min="0.5"
                max="1"
                value={compactionRatio}
                onChange={(e) => setCompactionRatio(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-text-primary" htmlFor="memory-summary-chars">
                {localize('com_ui_memories_compaction_chars')}
              </label>
              <Input
                id="memory-summary-chars"
                type="number"
                min="100"
                max="1000"
                value={summaryChars}
                onChange={(e) => setSummaryChars(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={preferencesMutation.isLoading}
              onClick={onSaveCompaction}
            >
              {localize('com_ui_save')}
            </Button>
          </div>
        </OGDialogContent>
      </OGDialog>
    </div>
  );
};

export default AdminSettings;
