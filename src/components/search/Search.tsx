import React from 'react';
import { DataSearch } from '@appbaseio/reactivesearch';
import Router from 'next/router';

const App = () => {
  return (
    <>
      <DataSearch
        componentId='q'
        dataField={['name', 'desc', 'title', 'body', 'username', 'fullname', 'about']}
        fieldWeights={[2, 1, 2, 1, 2, 2, 1]}
        URLParams
        onValueSelected={(value) => Router.push(`/search?q=${value}`)}
        placeholder='Search Subsocial'
        iconPosition='right'
        className='DfSearch'
        innerClass={{ list: 'visible menu transition' }}
      />
    </>
  );
};

export default App;
