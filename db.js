module.exports = {
  persist: (msg) => {
    console.log('persisting:', { msg });
    return new Promise((res, rej) => {
      if (msg === 'fail') {
        return rej('Error');
      }
      res({ msg, ok: true });
    });
  },
};
