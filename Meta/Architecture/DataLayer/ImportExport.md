# Import / Export

> Markdown 导入导出设计

## 导出为 Markdown

```yaml
ExportConfig:
  format: markdown

  structure:
    story-bible:
      characters:
        template: |
          # {{id}} {{name}}

          ## 基础信息
          - **定位**: {{role}}
          - **外貌**: {{appearance}}

          ## 内核
          ### 动机
          - 表层: {{motivation.surface}}
          - 深层: {{motivation.hidden}}
          - 核心: {{motivation.core}}
          ...

      world:
        - power_system.md
        - locations/
        - factions/

      plot:
        - main_arc.md
        - subplots.md
        - foreshadowing.md

    draft:
      - vol_{{volume.id}}/
        - ch_{{chapter.id | pad: 3}}.md

  options:
    include_metadata: false      # 不导出元数据
    include_check_results: false # 不导出检查结果
```

## 导入 Markdown（可选功能）

```yaml
ImportConfig:
  parse_rules:
    character:
      pattern: "# (C\\d+) (.+)"
      fields:
        id: $1
        name: $2

    chapter:
      pattern: "vol_(\\d+)/ch_(\\d+)\\.md"
      fields:
        volume_id: $1
        id: $2

  on_conflict:
    strategy: ask_user         # ask_user | overwrite | skip | merge
```

## 导出流程

1. 读取 SQLite 数据
2. 应用模板渲染
3. 写入文件系统
4. 通知用户完成

## 导入流程

1. 扫描 Markdown 文件
2. 解析结构和内容
3. 检测冲突（与现有数据对比）
4. 用户确认策略
5. 写入 SQLite
