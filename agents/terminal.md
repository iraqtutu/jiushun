```markdown
# 终端同步绕过 & 故障保护
### 配置变量
要调整终端绕过规则的行为，请修改以下变量：
*   **`[VAR_TEMP_DIR]`**： `.agents/tmp/` -> 存储输出文件的相对于工作空间的目录。
*   **`[VAR_FAST_TRACK_MS]`**： `2500` -> 等待命令的时间（毫秒），然后再将其发送到后台。增加这个时间可以允许更多命令同步完成并节省验证步骤。
*   **`[VAR_CLEANUP_DAYS]`**： `+1` -> 删除旧终端日志的天数。
*   **`[VAR_TIMEOUT_MINS]`**： `2` -> 后台命令可以运行多长时间（分钟），然后代理会提示终止。
---
### 终端同步绕过（强制）
为了避免已知的平台错误，例如终端输出卡住或状态卡在 `RUNNING`，**始终**按照以下步骤执行每个终端命令：
**先决条件 & 清理**：在对话中运行你的第一个命令之前：
*   确保目录存在： `mkdir -p [VAR_TEMP_DIR]`
*   通过删除先前对话的旧终端输出来保持工作空间清洁： `find [VAR_TEMP_DIR] -type f -name "ag_output_*.txt" -mtime [VAR_CLEANUP_DAYS] -delete 2>/dev/null || true`
*   *注意：始终读取和写入 `[VAR_TEMP_DIR]`。这避免了工作空间外的权限提示，同时保持临时执行文件的组织性。*
2.  **强制重定向（使用 Tee）**：将 `2>&1 | tee [VAR_TEMP_DIR]ag_output_<conversation_id>.txt && echo "===AGENT COMMAND DONE===" >> [VAR_TEMP_DIR]ag_output_<conversation_id>.txt` 附加到每个 `run_command` 调用。
*   *为什么？ `tee` （没有 `-a`）会为同一对话中的每个新命令覆盖文件，保持文件较小。它确保输出对用户在 IDE 终端中可见，同时也将其安全地写入文件，供代理验证。*
3.  **等待注入**：将 `WaitMsBeforeAsync` 参数设置为 `run_command` 工具的 `[VAR_FAST_TRACK_MS]`。
### 完成逻辑 & 优化（强制）
*   **同步快速通道**：如果 `run_command` 在 `[VAR_FAST_TRACK_MS]` 窗口内完成，它将直接返回输出（不生成后台命令 ID）。你可以正常使用输出，并**跳过**下面的验证步骤。
*   **异步文件系统验证**：如果命令超过 `[VAR_FAST_TRACK_MS]` 并返回后台命令 ID，立即在 `[VAR_TEMP_DIR]ag_output_<conversation_id>.txt`上调用 `view_file` 。
*   将此文件的内容视为官方命令输出。如果文件包含 "===AGENT COMMAND DONE===" 标记，请立即继续执行任务。
*   *忽略状态挂起*：如果 `view_file` 确认命令已完成执行，则永远不要等待 `command_status` 报告 `DONE` 。如果命令似乎卡在 UI 中，请忽略它并移至下一步。
### 长时间运行命令故障保护（强制）
为了防止僵尸进程或失控命令无限期地挂起任务，始终对命令执行强制执行严格的时间限制：
*   **时间限制**：如果终端后台命令已运行 `[VAR_TIMEOUT_MINS]` 分钟而没有产生预期的输出或完成标记，**停止隐式等待**。
*   **提示操作**：使用 `notify_user` 工具明确要求用户确认。例如：“命令 `XYZ` 已经运行了超过 `[VAR_TIMEOUT_MINS]` 分钟。我应该继续等待，还是终止它？”
*   **终止工具**：如果用户指示你终止它，请使用 `send_command_input` 工具，使用 `Terminate: true` 和相应的 `CommandId` 来干净地杀死失控的进程。
```
