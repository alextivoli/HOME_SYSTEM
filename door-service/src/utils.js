export function id() {
    let i = 1;
    return function () {
        const n = i;
        i++;
        return n;
    }
  }