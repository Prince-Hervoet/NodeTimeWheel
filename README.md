# NodeTimeWheel
About a timewheel with ts.

This project is a timewheel experiment implemented with ts.If you have any question,you can challenge me. 
```
  const w = new TimeWheel();
  w.setCellCount(5).setGranularity(3000).setMaxTaskSize(1000);
  w.start();

  const test: TimeTask = {
    callback: (data: any) => {
      console.log("我被执行了");
      return {};
    },
  };
  const j = w.add(test, 9812);
  console.log(j);
```
