import { LessTaskQueue } from "./lessTaskQueue.js";
import { nanoid } from "nanoid";
export class TimeWheel {
    constructor() {
        // 格子数量
        this.cellCount = 0;
        // 当前所在格子
        this.currentCellIndex = 0;
        // 时间粒度
        this.granularity = 0;
        // 轮次
        this.tick = 0;
        // 任务队列
        this.taskQueues = [];
        this.timerId = -1;
        this.add = (task, setTime) => {
            if (this.taskSize === this.maxTaskSize || !task || setTime <= 0) {
                return "-1";
            }
            const now = new Date().getTime();
            const need = Math.ceil((now + setTime - this.startTimestamp) / this.granularity);
            const temp = need / this.cellCount;
            const tick = Math.floor(temp);
            const cellIndex = need - tick * this.cellCount;
            const taskId = nanoid();
            const taskPackage = {
                id: taskId,
                task,
                updateAt: now,
                willUpdateAt: now + setTime,
                tick,
                deleted: false,
            };
            console.log(taskPackage);
            this.taskQueues[cellIndex].add(taskPackage);
            ++this.taskSize;
            this.idToTask[taskId] = taskPackage;
            return taskId;
        };
        this.quitTask = (taskId) => {
            const value = this.idToTask[taskId];
            if (value) {
                value.deleted = true;
            }
        };
        this.size = () => {
            return this.taskSize;
        };
        this.start = () => {
            if (this.cellCount === 0 ||
                this.granularity === 0 ||
                this.maxTaskSize === 0) {
                return;
            }
            for (let i = 0; i < this.cellCount; i++) {
                this.taskQueues.push(new LessTaskQueue((a, b) => {
                    if (a.tick > b.tick) {
                        return 1;
                    }
                    else if (a.tick < b.tick) {
                        return -1;
                    }
                    else {
                        if (a.willUpdateAt > b.willUpdateAt) {
                            return 1;
                        }
                        else if (a.willUpdateAt < b.willUpdateAt) {
                            return -1;
                        }
                        else {
                            return 0;
                        }
                    }
                }));
            }
            this.idToTask = new Map();
            this.solveTaskInQueue();
            this.timerId = setInterval(() => {
                ++this.currentCellIndex;
                if (this.currentCellIndex === this.cellCount) {
                    this.currentCellIndex = 0;
                    ++this.tick;
                }
                console.log("当前轮次: " + this.tick);
                console.log("当前格子: " + this.currentCellIndex);
                this.solveTaskInQueue();
            }, this.granularity);
            this.startTimestamp = new Date().getTime();
        };
        this.stop = () => {
            if (this.timerId) {
                clearInterval(this.timerId);
            }
            this.taskQueues.forEach((taskQueue) => {
                while (!taskQueue.isEmpty()) {
                    const ele = taskQueue.poll();
                    ele === null || ele === void 0 ? void 0 : ele.task.callback(ele.task);
                }
            });
            for (let i = 0; i < this.taskQueues.length; i++) {
                this.taskQueues.pop();
            }
        };
        this.solveTaskInQueue = () => {
            var _a, _b;
            const queue = this.taskQueues[this.currentCellIndex];
            while (!queue.isEmpty()) {
                const needTick = (_b = (_a = queue.peek()) === null || _a === void 0 ? void 0 : _a.tick) !== null && _b !== void 0 ? _b : -1;
                if (needTick === -1 || needTick > this.tick) {
                    break;
                }
                const ele = queue.poll();
                this.idToTask.delete(ele.id);
                --this.taskSize;
                if (ele.deleted) {
                    continue;
                }
                ele.task.callback(ele.task);
            }
        };
        this.setCellCount = (count) => {
            this.cellCount = count;
            return this;
        };
        this.setGranularity = (granularity) => {
            this.granularity = granularity;
            return this;
        };
        this.setMaxTaskSize = (size) => {
            this.maxTaskSize = size;
            return this;
        };
    }
}
class WheelTimeTask {
}
