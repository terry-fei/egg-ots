'use strict';

const assert = require('assert');
const TableStore = require('tablestore');

module.exports = app => {
  app.addSingleton('ots', createClient);
};

function createClient(config, app) {
  assert(
    config.accessKeyId &&
      config.secretAccessKey &&
      config.endpoint !== undefined &&
      config.instancename !== undefined,
    `[egg-ots] 'accessKeyId: ${config.accessKeyId}', 'secretAccessKey: ${config.secretAccessKey}', 'endpoint: ${config.endpoint}', 'instancename: ${config.instancename}' are required on config`
  );
  app.coreLogger.info(
    '[egg-ots] server connecting ots://:***@%s/%s',
    config.endpoint,
    config.instancename
  );

  const client = new TableStore.Client(config);

  client.get = async (pk, columns = []) => {
    const pkArr = Object.keys(pk).map(key => {
      if (typeof pk[key] === 'number') {
        return { [key]: TableStore.Long.fromNumber(pk[key]) };
      }
      return { [key]: pk[key] };
    });
    if (typeof columns === 'string') {
      columns = columns.split(' ');
    }
    const params = {
      tableName: config.instancename,
      primaryKey: pkArr,
      maxVersions: 1,
      columnsToGet: columns,
    };

    let res;
    try {
      res = await client.getRow(params);
    } catch (error) {
      error.message = 'ots获取key失败';
      throw error;
    }

    const { primaryKey, attributes } = res;
    if (!primaryKey || !primaryKey.length) {
      return null;
    }

    const attrs = attributes.reduce((prev, curr) => {
      if (curr.columnValue.toNumber) {
        prev[curr.columnName] = curr.columnValue.toNumber();
      } else {
        prev[curr.columnName] = curr.columnValue;
      }

      return prev;
    }, {});

    return attrs;
  };

  client.put = async (pk, attrs) => {
    const pkArr = Object.keys(pk).map(key => {
      if (typeof pk[key] === 'number') {
        return { [key]: TableStore.Long.fromNumber(pk[key]) };
      }
      return { [key]: pk[key] };
    });
    const attrArr = Object.keys(attrs).map(key => {
      if (typeof pk[key] === 'number') {
        return { [key]: TableStore.Long.fromNumber(pk[key]) };
      }
      return { [key]: pk[key] };
    });

    const params = {
      tableName: config.instancename,
      condition: new TableStore.Condition(
        TableStore.RowExistenceExpectation.IGNORE,
        null
      ),
      primaryKey: pkArr,
      attributeColumns: attrArr,
      returnContent: { returnType: TableStore.ReturnType.Primarykey },
    };

    await client.putRow(params);
  };

  client.update = async (pk, attrs) => {
    const pkArr = Object.keys(pk).map(key => {
      if (typeof pk[key] === 'number') {
        return { [key]: TableStore.Long.fromNumber(pk[key]) };
      }
      return { [key]: pk[key] };
    });
    const attrArr = Object.keys(attrs).map(key => {
      if (typeof pk[key] === 'number') {
        return { [key]: TableStore.Long.fromNumber(pk[key]) };
      }
      return { [key]: pk[key] };
    });

    const params = {
      tableName: config.instancename,
      condition: new TableStore.Condition(
        TableStore.RowExistenceExpectation.IGNORE,
        null
      ),
      primaryKey: pkArr,
      updateOfAttributeColumns: [
        {
          PUT: attrArr,
        },
      ],
      returnContent: { returnType: TableStore.ReturnType.Primarykey },
    };

    await client.updateRow(params);
  };

  client.delete = async pk => {
    const pkArr = Object.keys(pk).map(key => {
      if (typeof pk[key] === 'number') {
        return { [key]: TableStore.Long.fromNumber(pk[key]) };
      }
      return { [key]: pk[key] };
    });

    const params = {
      tableName: config.instancename,
      condition: new TableStore.Condition(
        TableStore.RowExistenceExpectation.IGNORE,
        null
      ),
      primaryKey: pkArr,
    };

    await client.deleteRow(params);
  };

  client.range = async (startPk, endPk, limit) => {
    const startPkArr = Object.keys(startPk).map(key => {
      if (typeof startPk[key] === 'number') {
        return { [key]: TableStore.Long.fromNumber(startPk[key]) };
      }
      if (startPk[key] === 'min') {
        return { [key]: TableStore.INF_MIN };
      }
      if (startPk[key] === 'max') {
        return { [key]: TableStore.INF_MAX };
      }
      return { [key]: startPk[key] };
    });
    const endPkArr = Object.keys(endPk).map(key => {
      if (typeof endPk[key] === 'number') {
        return { [key]: TableStore.Long.fromNumber(endPk[key]) };
      }
      if (startPk[key] === 'min') {
        return { [key]: TableStore.INF_MIN };
      }
      if (startPk[key] === 'max') {
        return { [key]: TableStore.INF_MAX };
      }
      return { [key]: endPk[key] };
    });
    const params = {
      tableName: config.instancename,
      direction: TableStore.Direction.FORWARD,
      maxVersions: 1,
      inclusiveStartPrimaryKey: startPkArr,
      exclusiveEndPrimaryKey: endPkArr,
      limit,
    };

    await client.getRange(params);
  };
  return client;
}
