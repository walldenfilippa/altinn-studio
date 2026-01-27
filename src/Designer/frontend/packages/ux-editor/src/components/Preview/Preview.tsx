import React, { useEffect } from 'react';
import classes from './Preview.module.css';
import { useStudioEnvironmentParams } from 'app-shared/hooks/useStudioEnvironmentParams';
import { useTranslation } from 'react-i18next';
import { useAppContext, useGetLayoutSetByName } from '../../hooks';
import { useChecksum } from '../../hooks/useChecksum.ts';
import { previewPage } from 'app-shared/api/paths';
import { Button, Paragraph } from '@digdir/designsystemet-react';
import { usePdf } from '../../hooks/usePdf/usePdf';
import { useDevToolsStore } from '../../../../../features/devtools/DevToolsStore';
import { useTaskTypeFromBackend } from '../../../../../features/instance/useProcessQuery';
import {
  StudioCenter,
  StudioAlert,
  StudioSpinner,
  StudioValidationMessage,
} from '@studio/components';
import { PreviewLimitationsInfo } from 'app-shared/components/PreviewLimitationsInfo/PreviewLimitationsInfo';
import { useSelectedTaskId } from 'app-shared/hooks/useSelectedTaskId';
import { useCreatePreviewInstanceMutation } from 'app-shared/hooks/mutations/useCreatePreviewInstanceMutation';
import { useUserQuery } from 'app-shared/hooks/queries';
import { PreviewActions } from './PreviewActions/PreviewActions';
import useUxEditorParams from '@altinn/ux-editor/hooks/useUxEditorParams';
import { FilePdfIcon } from '@studio/icons';

export type PreviewProps = {
  collapsed: boolean;
  onCollapseToggle: () => void;
  hidePreview?: boolean;
};

export enum ProcessTaskType {
  Unknown = 'unknown',
  Service = 'service',
  Data = 'data',
  Archived = 'ended',
  Confirm = 'confirmation',
  Feedback = 'feedback',
  Payment = 'payment',
  Signing = 'signing',
}

export const Preview = ({ collapsed, onCollapseToggle, hidePreview }: PreviewProps) => {
  const { t } = useTranslation();
  const { selectedFormLayoutName } = useAppContext();
  const noPageSelected =
    selectedFormLayoutName === 'default' || selectedFormLayoutName === undefined;

  return collapsed ? (
    <PreviewActions
      toggleTitle={t('ux_editor.open_preview')}
      className={classes.toolbarCollapsed}
      onCollapseToggle={onCollapseToggle}
    />
  ) : (
    <div className={classes.root}>
      <PreviewActions
        toggleTitle={t('ux_editor.close_preview')}
        className={classes.toolbar}
        onCollapseToggle={onCollapseToggle}
      />
      {noPageSelected ? (
        <NoSelectedPageMessage />
      ) : (
        <>
          {hidePreview && (
            <div
              style={{
                display: 'block',
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
              }}
            ></div>
          )}
          <PreviewFrame />
        </>
      )}
    </div>
  );
};

// Message to display when no page is selected
const NoSelectedPageMessage = () => {
  const { t } = useTranslation();
  return (
    <StudioCenter>
      <Paragraph size='medium'>{t('ux_editor.no_components_selected')}</Paragraph>
    </StudioCenter>
  );
};

// The actual preview frame that displays the selected page
const PreviewFrame = () => {
  const { org, app } = useStudioEnvironmentParams();
  const { previewIframeRef, selectedFormLayoutName } = useAppContext();
  const { layoutSet } = useUxEditorParams();
  const taskId = useSelectedTaskId(layoutSet);
  const { t } = useTranslation();
  const { data: user } = useUserQuery();

  const { shouldReloadPreview, previewHasLoaded } = useAppContext();
  const checksum = useChecksum(shouldReloadPreview);
  const {
    mutate: createInstance,
    data: instance,
    isError: createInstanceError,
    isPending: createInstancePending,
  } = useCreatePreviewInstanceMutation(org, app);

  const currentLayoutSet = useGetLayoutSetByName({ name: layoutSet, org, app });
  const isSubform = currentLayoutSet?.type === 'subform';

  const { isCurrentPagePdf } = usePdf();
  const isPDF = isCurrentPagePdf();
  const setPdfPreview = useDevToolsStore((state) => state.actions.setPdfPreview);
  const taskType = useTaskTypeFromBackend();

  useEffect(() => {
    if (user && taskId) createInstance({ partyId: user?.id, taskId: taskId });
  }, [createInstance, user, taskId]);

  useEffect(() => {
    return () => {
      previewIframeRef.current = null;
    };
  }, [previewIframeRef]);

  if (createInstancePending || !instance) {
    return (
      <StudioCenter>
        {createInstanceError ? (
          <StudioValidationMessage>{t('general.page_error_title')}</StudioValidationMessage>
        ) : (
          <StudioSpinner aria-hidden spinnerTitle={t('preview.loading_preview_controller')} />
        )}
      </StudioCenter>
    );
  }
  const previewURL = previewPage(org, app, layoutSet, taskId, selectedFormLayoutName, instance?.id);

  if (isPDF) {
    return (
      <div className={classes.root}>
        <div className={classes.previewArea}>
          <Button
            onClick={() => setPdfPreview(true)}
            disabled={taskType !== ProcessTaskType.Data}
            color='second'
          >
            <FilePdfIcon fontSize='1rem' aria-hidden />
            Forhåndsvis PDF
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className={classes.root}>
      {isSubform ? (
        <StudioAlert className={classes.alert} data-color='warning'>
          {t('ux_editor.preview.subform_unsupported_warning')}
        </StudioAlert>
      ) : (
        <div className={classes.previewArea}>
          <div className={classes.iframeContainer}>
            <iframe
              key={checksum}
              ref={previewIframeRef}
              className={classes.iframe}
              title={t('ux_editor.preview')}
              src={previewURL}
              onLoad={previewHasLoaded}
            />
          </div>
          <PreviewLimitationsInfo />
        </div>
      )}
    </div>
  );
};
