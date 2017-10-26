const { exec } = require('child_process');

const helper = (() => {

  let _isDst = false;

  const _getIsDst = (tz = 'US/Eastern', interval = (3600 * 1000)) => {
    exec('python -c "import time;print time.localtime()[-1];exit();"', { env: {TZ: tz} }, (err, stdout, stderr) => {

      _isDst = (stdout || '').trim(/^(\n|\r|\t|\s)+|(\n|\r|\t|\s)+$/g) === '1';

      setTimeout(() => {
        _getIsDst();
      }, interval);

    });
  };

  // start DST "job"
  _getIsDst();

  return {
    isDst: () => (_isDst)
  };

})();

module.exports = helper;
