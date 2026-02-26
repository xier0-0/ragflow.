# 使用 Ollama 部署本地 LLM / Embedding / Rerank（基于 /mnt/cfs/zhangjiyuan）

本文档说明如何在 **无 sudo 权限** 的情况下，在当前机器的 `/mnt/cfs/zhangjiyuan` 目录下部署并使用以下三类本地模型，并接入 RAGFlow：

- **Chat LLM**：`deepseek-v2:16b`
- **Embedding**：`qwen3-embedding:4b-q5_K_M`
- **Rerank**：`dengcao/Qwen3-Reranker-4B:Q5_K_M`

> **约定**：
> - 你的「个人工作根目录」是：`/mnt/cfs/zhangjiyuan`
> - 其中已经或将会包含：`bin/`（存放可执行程序）、`ollama/`（模型与数据）、`logs/`（日志）等。

---

## 0. 硬件环境（Intel Xeon Platinum 8350C）

本文档在以下 CPU 环境下验证通过，可直接按步骤部署：

| 项目 | 配置 |
|------|------|
| CPU | Intel Xeon Platinum 8350C × 2 |
| 架构 | Ice Lake（数据中心级） |
| 核心/线程 | 32 核 × 2 socket，每核 2 线程，**总计 128 线程** |
| 最大频率 | 3.5 GHz |
| 特性 | AVX512、大内存、高带宽 PCIe |
| 典型用途 | AI 推理、分布式计算、HPC、高并发服务 |

**Ollama 使用说明**：本文档采用官方 `ollama-linux-amd64` 二进制，在 Ice Lake 架构下会自动利用 **AVX512** 加速 CPU 推理，适合纯 CPU 或 CPU+GPU 混合部署。

---

## 1. 目录规划与环境约定

### 1.1 目录结构约定

后续步骤中，我们约定使用如下目录（不存在时会自动创建）：

| 用途             | 路径                                  |
|------------------|---------------------------------------|
| 基础目录         | `/mnt/cfs/zhangjiyuan`                |
| 可执行文件目录   | `/mnt/cfs/zhangjiyuan/bin`            |
| Ollama 数据目录  | `/mnt/cfs/zhangjiyuan/ollama`         |
| 日志目录（可选） | `/mnt/cfs/zhangjiyuan/logs`           |

你可以在终端先执行一次：

```bash
mkdir -p /mnt/cfs/zhangjiyuan/bin
mkdir -p /mnt/cfs/zhangjiyuan/ollama
mkdir -p /mnt/cfs/zhangjiyuan/logs
```

### 1.2 PATH 环境变量约定

为了在任何地方都能直接执行 `ollama`，建议把 `/mnt/cfs/zhangjiyuan/bin` 加入 PATH。

**临时（当前终端）**：

```bash
export PATH="/mnt/cfs/zhangjiyuan/bin:$PATH"
```

**长期（写入 `~/.bashrc`，下次登录自动生效）**：

```bash
echo 'export PATH="/mnt/cfs/zhangjiyuan/bin:$PATH"' >> ~/.bashrc
# 立即在当前终端生效：
source ~/.bashrc
```

> 后文所有命令都假定你已经在当前终端执行过：`export PATH="/mnt/cfs/zhangjiyuan/bin:$PATH"`。

---

## 2. 在 /mnt/cfs/zhangjiyuan/bin 安装无 sudo 版 Ollama

### 2.1 下载 Ollama 可执行文件

```bash
cd /mnt/cfs/zhangjiyuan

# 下载 Linux AMD64 版 Ollama 主程序到 bin
curl -L https://ollama.com/download/ollama-linux-amd64 \
  -o /mnt/cfs/zhangjiyuan/bin/ollama

# 赋予执行权限
chmod +x /mnt/cfs/zhangjiyuan/bin/ollama
```

### 2.2 验证安装

```bash
export PATH="/mnt/cfs/zhangjiyuan/bin:$PATH"

ollama --version
```

如果能输出类似 `ollama version 0.x.x`，说明安装成功。

---

## 3. 启动 Ollama 服务（使用 /mnt/cfs/zhangjiyuan/ollama 作为数据目录）

为了把所有模型与缓存都放到 `/mnt/cfs/zhangjiyuan/ollama`，我们用环境变量 `OLLAMA_HOME` 指向该路径。

### 3.1 前台运行（调试/开发时推荐）

在**一个单独终端**中执行（建议一直保持这个终端不要关闭）：

```bash
export PATH="/mnt/cfs/zhangjiyuan/bin:$PATH"
# 指定 Ollama 的数据根目录
export OLLAMA_HOME="/mnt/cfs/zhangjiyuan/ollama"
# 启动 Ollama 服务（前台）
ollama serve
```

看到类似输出：

```
Listening on 127.0.0.1:11434
```

表示服务成功启动，默认监听在 `http://localhost:11434/`。

### 3.2 后台运行（可选）

如果你希望 Ollama 服务在后台运行，可以在**另一个终端**中执行：

```bash
export PATH="/mnt/cfs/zhangjiyuan/bin:$PATH"
export OLLAMA_HOME="/mnt/cfs/zhangjiyuan/ollama"

nohup ollama serve > /mnt/cfs/zhangjiyuan/logs/ollama-serve.log 2>&1 &
```

以后查看日志可以用：

```bash
tail -f /mnt/cfs/zhangjiyuan/logs/ollama-serve.log
```

---

## 4. 使用 Ollama 拉取三类模型（LLM / Embedding / Rerank）

> 注意：以下所有 `ollama pull` 命令需要在 Ollama 服务可用的前提下执行（即 `ollama serve` 已在某个终端运行）。

在**一个新的终端**中执行：

```bash
export PATH="/mnt/cfs/zhangjiyuan/bin:$PATH"
export OLLAMA_HOME="/mnt/cfs/zhangjiyuan/ollama"
```

### 4.1 拉取 Chat LLM：`deepseek-v2:16b`

```bash
ollama pull deepseek-v2:16b
```

- 深度求索 DeepSeek 系列 16B 模型，MoE 架构，支持中英文，高性能。
- 需要一定显存和磁盘空间；没有 GPU 也可以在 CPU 上跑，只是速度会慢。

### 4.2 拉取 Embedding 模型：`qwen3-embedding:4b-q5_K_M`

我们选择 Qwen3 Embedding 4B 的 Q5_K_M 量化版本（质量/速度较平衡）：

```bash
ollama pull qwen3-embedding:4b-q5_K_M
```

> 如果显存压力较大，可以改成：`qwen3-embedding:4b-q4_K_M`，占用更小，精度略低。

### 4.3 拉取 Reranker 模型：`dengcao/Qwen3-Reranker-4B:Q5_K_M`

```bash
ollama pull dengcao/Qwen3-Reranker-4B:Q5_K_M
```

- 这是 Qwen3-Reranker-4B 的 Q5_K_M 量化版，适合在检索后做文本重排。
- 若后续 RAGFlow 支持基于 Ollama 的 rerank 接口，即可直接调用此模型。

### 4.4 快速验证已有模型

#### 列出本地模型

```bash
curl http://localhost:11434/api/tags
```

输出结果中应包含：

- `deepseek-v2:16b`
- `qwen3-embedding:4b-q5_K_M`
- `dengcao/Qwen3-Reranker-4B:Q5_K_M`

#### 测试 LLM 简单对话

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "deepseek-v2:16b",
  "prompt": "请用中文简单介绍一下你自己。"
}'
```

如果能返回一段中文文本，则说明 LLM 正常。（Embedding 和 Rerank 通常通过上层应用调用，这里不单独测。）

---

## 5. 在 RAGFlow 中接入 Ollama 模型

> 这里只描述核心配置逻辑，具体 UI 可能会因 RAGFlow 版本略有差异。  
> 前提：RAGFlow 运行在同一台机器上，能够访问 `http://localhost:11434`。

### 5.1 确认 RAGFlow 到 Ollama 的连通性（可选但推荐）

在运行 RAGFlow 的那台机器上（同一台机），执行：

```bash
curl http://localhost:11434/
```

若返回如 `Ollama is running` 或 JSON，则说明网络连通正常。

> 若未来 RAGFlow 迁入 Docker 容器，需要将 `localhost` 改成 `host.docker.internal`，下文会说明。

### 5.2 在 RAGFlow Web 界面添加 Ollama Provider

1. 打开 RAGFlow Web 前端。
2. 右上角点击头像/Logo → 进入 **Model providers（模型提供商）** 页面。
3. 找到 **Ollama** 条目，点击 **Add** 或 **添加**。
4. 在弹出的配置对话框中填写：
   - **Base URL**：
     - 如果 RAGFlow 也是在宿主机（源码本地起服务）：填写 `http://localhost:11434`
     - 如果未来 RAGFlow 在 Docker 容器里，而 Ollama 在宿主机：填写 `http://host.docker.internal:11434`
   - **API Key**：Ollama 默认不需要，可留空或填 `dummy`。
5. 点击保存/确认。

---

## 6. 在 RAGFlow 中指定默认 LLM / Embedding / Rerank 模型

### 6.1 进入系统模型设置（System Model Settings）

1. 仍然在 Model providers 页面中。
2. 找到 **System Model Settings（系统模型设置）** 或类似入口，点击进入。

### 6.2 选择默认 Chat 模型（LLM）

- 在 **Chat model / 对话模型** 下拉列表中选择：**`deepseek-v2:16b`**

> 如果列表太长，可先在搜索框中输入 `deepseek` 进行过滤。

设置完成后，RAGFlow 中默认的聊天场景（如「对话」页面）会优先使用此模型。

### 6.3 选择默认 Embedding 模型

- 在 **Embedding model / 嵌入模型** 下拉列表中选择：**`qwen3-embedding:4b-q5_K_M`**

> 如果机器资源稍弱，可以改选 `qwen3-embedding:4b-q4_K_M`。

设置完成后，知识库构建、文档向量化等流程会默认使用该模型生成向量。

### 6.4 选择默认 Rerank 模型（若界面支持）

- 在 **Rerank model / 重排模型** 下拉列表中选择：**`dengcao/Qwen3-Reranker-4B:Q5_K_M`**

> 说明：
> - 某些版本的 RAGFlow 可能暂时 **不支持通过 Ollama Provider 调用 Rerank 模型**，如果你在下拉框里看不到相应条目，这属于版本能力限制，而不是配置错误。
> - 即便如此，LLM 与 Embedding 仍然可以正常工作，等后续版本支持后，只需回到此处补选 `dengcao/Qwen3-Reranker-4B:Q5_K_M` 即可。

### 6.5 保存配置

检查三类模型名称无误后，点击保存按钮。如有「测试连接」按钮，可点一次验证。

---

## 7. 在具体功能中验证与使用

### 7.1 对话功能验证（Chat）

1. 打开 RAGFlow 的「对话」/「聊天」页面。
2. 新建会话，在右侧模型选择中，确认已选中或可选：`deepseek-v2:16b`。
3. 输入中文问题，比如：「解释一下向量数据库在 RAG 中的作用？」
4. 若能正常得到合理回答，说明 Chat LLM 配置成功。

### 7.2 知识库 / 检索验证（Embedding）

1. 新建一个小型知识库，上传 1~3 篇短文档。
2. 等待索引完成（会使用 `qwen3-embedding:4b-q5_K_M` 生成向量）。
3. 在知识库问答中提几个与文档内容相关的问题。
4. 如能正确检索并回答，说明 Embedding 模型链路正常。

### 7.3 重排验证（Rerank，若版本支持）

1. 在索引/检索配置中，若出现「重排模型 / Rerank model」选项，选择 `dengcao/Qwen3-Reranker-4B:Q5_K_M`。
2. 使用一个内容较多的知识库，进行检索问答。
3. 对比「开启重排」和「关闭重排」时，返回结果是否更加相关和稳定。

---

## 8. 常见问题与排查思路

### 8.1 `ollama` 命令找不到

检查是否已将 `/mnt/cfs/zhangjiyuan/bin` 加入 PATH：

```bash
echo $PATH | grep /mnt/cfs/zhangjiyuan/bin
```

若未包含，重新执行：

```bash
export PATH="/mnt/cfs/zhangjiyuan/bin:$PATH"
```

并考虑写入 `~/.bashrc`。

### 8.2 RAGFlow 提示无法连接 Ollama

首先在终端确认 Ollama 服务是否正常：

```bash
curl http://localhost:11434/
```

若 RAGFlow 在 Docker 容器中运行，需要在容器内测试：

```bash
# 进入 RAGFlow 容器后
curl http://host.docker.internal:11434/
```

确保 RAGFlow 的 Ollama Base URL 与实际访问地址对应（本机则用 `localhost`，容器内则用 `host.docker.internal`）。

### 8.3 模型加载太慢或 OOM

优先降级量化版本：

- **LLM**：可以考虑换成 `deepseek-v2:16b` 的更轻量标签，或其它更小模型（如 `deepseek-v2:7b`，视 Ollama 库情况而定）。
- **Embedding**：`qwen3-embedding:4b-q4_K_M` 代替 Q5 版本。
- **Rerank**：若机器资源有限，可暂时关闭重排，仅使用 Embedding 检索。
