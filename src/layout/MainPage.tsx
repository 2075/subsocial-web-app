import React from 'react';

import settings from '../components/settings';
import '@polkadot/ui-app/i18n';
import '../components/utils/styles';

import dynamic from 'next/dynamic';
// import Suspense from '../components/utils/Suspense';
const Suspense = dynamic(() => import('../components/utils/Suspense'));
import store from 'store';
import { getTypeRegistry } from '@polkadot/types';
import { Api } from '@polkadot/ui-api';

import { QueueConsumer } from '@polkadot/ui-app/Status/Context';
import Queue from '@polkadot/ui-app/Status/Queue';
import { registerSubsocialTypes } from '../components/types';
import Connecting from '../components/main/Connecting';
// const Connecting = dynamic(() => import('../components/main/Connecting'), { ssr: false });
import Menu from './SideMenu';
import Signer from '../components/ui-signer';
import { MyAccountProvider } from '../components/utils/MyAccountContext';
import { QueueProps } from '@polkadot/ui-app/Status/types';
import Status from '../components/main/Status';
import { ReactiveBase } from '@appbaseio/reactivesearch';
import { AllElasticIndexes, ElasticNodeURL } from '../config/ElasticConfig';
import { Layout } from 'antd';
import TopMenu from './TopMenu';
import { isBrowser } from 'react-device-detect';
import { Drawer } from 'antd-mobile';
import SidebarCollapsedProvider, { useSidebarCollapsed } from '../components/utils/SideBarCollapsedContext';

const { Header, Sider, Content } = Layout;

type Props = {
  children: React.ReactNode
};

console.log('The browser: ', isBrowser);

const SideMenu = (props: Props) => {
  const { children } = props;

  const { state: { collapsed }, toggle } = useSidebarCollapsed();

  const DesktopNav = () => (
    <>
      <Sider
        width={250}
        className='DfSider'
        trigger={null}
        collapsed={collapsed}
      >
        <Menu />
      </Sider>
      <Layout className='DfPageContent' style={{ padding: '0 24px 24px', marginLeft: collapsed ? '80px' : '250px' }}>
        <Content>{children}</Content>
      </Layout>
    </>
  );

  const MobileNav = () => (
    <Drawer
      className='DfMobileSideBar'
      style={{ minHeight: document.documentElement.clientHeight }}
      enableDragHandle
      contentStyle={{ color: '#A6A6A6', textAlign: 'center', paddingTop: 42 }}
      sidebar={<Menu />}
      open={!collapsed}
      onOpenChange={toggle}
    >
      <Layout>
        <Content className='DfPageContent'>{children}</Content>
      </Layout>
    </Drawer>
  );

  return <ReactiveBase
    url={ElasticNodeURL}
    app={AllElasticIndexes.join(',')}
  >
  <Layout style={{ backgroundColor: '#fafafa !important' }}>
    <Header className='DfHeader'>
      <TopMenu />
    </Header>
    <Layout style={{ marginTop: '60px' }}>
      {isBrowser
        ? <DesktopNav />
        : <MobileNav />
      }
    </Layout>
  </Layout>,
  </ReactiveBase>;
};

type LayoutProps = {
  isClient: boolean
};

const NextLayout: React.FunctionComponent<LayoutProps> = ({ children, isClient }) => {
  const url = process.env.SUBSTRATE_URL || settings.apiUrl || undefined;

  console.log('Web socket url=', url);

  try {
    registerSubsocialTypes();
    const types = store.get('types') || {};
    const names = Object.keys(types);

    if (names.length) {
      getTypeRegistry().register(types);
      console.log('Type registration:', names.join(', '));
    }
  } catch (error) {
    console.error('Type registration failed', error);
  }

  const ClientLayout = () => (
    <Suspense fallback='...'>
      <Queue>
        <QueueConsumer>
          {({ queueExtrinsic, queueSetTxStatus }) => {
            return (
              <Api
                queueExtrinsic={queueExtrinsic}
                queueSetTxStatus={queueSetTxStatus}
                url={url}
              >
                <MyAccountProvider>
                  <QueueConsumer>
                    {({ queueAction, stqueue, txqueue }: QueueProps) => (
                      <SidebarCollapsedProvider>
                          <SideMenu>
                            <Signer>
                              {children}
                              <Status
                                queueAction={queueAction}
                                stqueue={stqueue}
                                txqueue={txqueue}
                              />
                            </Signer>
                          </SideMenu>
                        </SidebarCollapsedProvider>
                    )}
                  </QueueConsumer>
                </MyAccountProvider>
                <Connecting />
              </Api>
            );
          }}
        </QueueConsumer>
      </Queue>
    </Suspense>
  );

  const ServerLayout = () => (
    <Queue>
      <QueueConsumer>
        {({ queueExtrinsic, queueSetTxStatus }) => {
          return (
            <Api
              queueExtrinsic={queueExtrinsic}
              queueSetTxStatus={queueSetTxStatus}
              url={url}
            >
              <MyAccountProvider>
                <SidebarCollapsedProvider>
                  <SideMenu>
                    {children}
                  </SideMenu>
                </SidebarCollapsedProvider>
              </MyAccountProvider>
            </Api>
          );
        }}
      </QueueConsumer>
    </Queue>
  );

  return <div id='root'>
    {isClient
      ? <ClientLayout/>
      : <ServerLayout/>}
  </div>;
};

export default NextLayout;
