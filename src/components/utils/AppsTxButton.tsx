// Copyright 2017-2020 @polkadot/react-components authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { TxButtonProps as BareTxButtonProps } from '@subsocial/react-components/types';

import React, { useCallback, useContext } from 'react';
import { SubmittableResult } from '@polkadot/api';
import { useApi, useToggle } from '@subsocial/react-hooks';
import { assert, isFunction, isUndefined } from '@polkadot/util';

import { StatusContext } from '@subsocial/react-components/Status';
import Button from '@subsocial/react-components/Button';
import { useAuth } from '../auth/AuthContext';

type ComputedFunc = () => (any[] | Promise<any[]>);

export type TxButtonProps = BareTxButtonProps & {
  params: any[] | ComputedFunc
}

function TxButton ({ accountId, className, extrinsic: propsExtrinsic, icon, isBasic, isDisabled, isIcon, isNegative, isPrimary, isUnsigned, label, onClick, onFailed, onSendRef, onStart, onSuccess, onUpdate, params, size, tooltip, tx, withSpinner }: TxButtonProps): React.ReactElement<TxButtonProps> {
  const { api } = useApi();
  const { queueExtrinsic } = useContext(StatusContext);
  const [ isSending, , setIsSending ] = useToggle(false);
  const { openSignInModal, state: { isSteps: { isTokens } } } = useAuth()
  const noTx = (!isUnsigned && !accountId) || !isTokens;
  console.log('No TX', noTx)
  const _onFailed = useCallback(
    (result: SubmittableResult | null): void => {
      setIsSending(false);

      onFailed && onFailed(result);
    },
    [ onFailed, setIsSending ]
  );

  const _onSuccess = useCallback(
    (result: SubmittableResult): void => {
      setIsSending(false);

      onSuccess && onSuccess(result);
    },
    [ onSuccess, setIsSending ]
  );

  const _onSend = useCallback(
    async (): Promise<void> => {
      onClick && onClick();

      if (noTx) {
        openSignInModal('AuthRequired')
        return setIsSending(false);
      }

      let extrinsic: any;

      if (propsExtrinsic) {
        extrinsic = propsExtrinsic;
      } else {
        const [ section, method ] = (tx || '').split('.');

        assert(api.tx[section] && api.tx[section][method], `Unable to find api.tx.${section}.${method}`);

        let resultParams = (params || []) as any[];

        if (isFunction(params)) {
          resultParams = await params()
        }

        extrinsic = api.tx[section][method](...(resultParams));
      }

      assert(extrinsic, 'Expected generated extrinsic passed to TxButton');

      if (withSpinner) {
        setIsSending(true);
      }

      queueExtrinsic({
        accountId: accountId && accountId.toString(),
        extrinsic,
        isUnsigned,
        txFailedCb: withSpinner ? _onFailed : onFailed,
        txStartCb: onStart,
        txSuccessCb: withSpinner ? _onSuccess : onSuccess,
        txUpdateCb: onUpdate
      });
    },
    [ _onFailed, _onSuccess, accountId, api.tx, isUnsigned, onClick, onFailed, onStart, onSuccess, onUpdate, params, propsExtrinsic, queueExtrinsic, setIsSending, tx, withSpinner ]
  );

  if (onSendRef) {
    onSendRef.current = _onSend;
  }

  return (
    <Button
      className={className}
      icon={icon || ''}
      isBasic={isBasic}
      isDisabled={isSending || isDisabled}
      isIcon={isIcon}
      isLoading={isSending}
      isNegative={isNegative}
      isPrimary={
        isUndefined(isPrimary) && isUndefined(isIcon)
          ? (!isNegative && !isBasic)
          : isPrimary
      }
      label={label || isIcon}
      onClick={_onSend}
      size={size}
      tooltip={tooltip}
    />
  );
}

export default React.memo(TxButton);
