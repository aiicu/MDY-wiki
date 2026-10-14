import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type DefaultTheme } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

const rootDir = fileURLToPath(new URL('..', import.meta.url))

function listEntries(dir: string): DefaultTheme.SidebarItem[] {
  const full = path.join(rootDir, dir)
  if (!fs.existsSync(full)) return []
  const items = fs
    .readdirSync(full, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        fs.existsSync(path.join(full, entry.name, 'main.md'))
    )
    .map((entry) => ({ text: entry.name, link: `/${dir}/${entry.name}/` }))
  return items.sort((a, b) => a.text.localeCompare(b.text, 'zh-CN'))
}

function listFiles(dir: string): DefaultTheme.SidebarItem[] {
  const full = path.join(rootDir, dir)
  if (!fs.existsSync(full)) return []
  const items = fs
    .readdirSync(full, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => {
      const name = entry.name.replace(/\.md$/, '')
      return { text: name, link: `/${dir}/${name}` }
    })
  return items.sort((a, b) => a.text.localeCompare(b.text, 'zh-CN'))
}

function tokenizeCJK(text: string): string[] {
  const tokens: string[] = []
  let latin = ''
  for (const char of text) {
    if (/[\u3400-\u9fff\uf900-\ufaff]/.test(char)) {
      if (latin) {
        tokens.push(latin.toLowerCase())
        latin = ''
      }
      tokens.push(char)
    } else if (/[0-9A-Za-z_]/.test(char)) {
      latin += char
    } else if (latin) {
      tokens.push(latin.toLowerCase())
      latin = ''
    }
  }
  if (latin) tokens.push(latin.toLowerCase())
  return tokens
}

const searchTranslations = {
  button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
  modal: {
    displayDetails: '显示详细列表',
    resetButtonTitle: '重置搜索',
    backButtonTitle: '关闭搜索',
    noResultsText: '没有结果',
    footer: {
      selectText: '选择',
      selectKeyAriaLabel: '输入',
      navigateText: '导航',
      navigateUpKeyAriaLabel: '上箭头',
      navigateDownKeyAriaLabel: '下箭头',
      closeText: '关闭',
      closeKeyAriaLabel: 'esc'
    }
  }
}

export default withMermaid(
  defineConfig({
    base: '/MDY-wiki/',
    lang: 'zh-CN',
    title: 'MDY 史记',
    description: 'cnapex-MDY 大家庭史记',
    cleanUrls: true,
    lastUpdated: true,
    srcExclude: ['README.md', '工程文档/**', '.vitepress/**'],
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag: string) => tag === 'font'
        }
      }
    },
    vite: {
      optimizeDeps: {
        include: ['mermaid']
      }
    },
    transformPageData(pageData) {
      const entryMatch = pageData.relativePath.match(
        /^(?:队伍线|个人线)\/([^/]+)\/(?:index|main)\.md$/
      )
      const otherMatch = pageData.relativePath.match(/^其他\/([^/]+)\.md$/)
      const name = entryMatch?.[1] ?? otherMatch?.[1]
      if (name && !pageData.frontmatter.title) {
        return { title: name }
      }
    },
    rewrites: {
      '队伍线/:team/main.md': '队伍线/:team/index.md',
      '个人线/:player/main.md': '个人线/:player/index.md'
    },
    markdown: {
      config(md: any) {
        md.core.ruler.push('ref-anchor-id', (state: any) => {
          for (const token of state.tokens) {
            if (token.type === 'inline' && token.children) {
              for (const child of token.children) {
                if (
                  child.type === 'html_inline' &&
                  child.content.includes('<a name=')
                ) {
                  child.content = child.content.replace(
                    /<a name="([^"]+)"/g,
                    '<a id="$1" name="$1"'
                  )
                }
              }
            } else if (
              token.type === 'html_block' &&
              token.content.includes('<a name=')
            ) {
              token.content = token.content.replace(
                /<a name="([^"]+)"/g,
                '<a id="$1" name="$1"'
              )
            }
          }
        })
      }
    },
    themeConfig: {
      nav: [
        { text: '首页', link: '/' },
        { text: '目录', link: '/目录' },
        { text: '个人线', link: '/个人线/' },
        { text: '队伍线', link: '/队伍线/' },
        { text: '其他', link: '/其他/' },
        { text: '投稿指南', link: '/投稿指南' }
      ],
      sidebar: {
        '/队伍线/': [{ text: '队伍线', items: listEntries('队伍线') }],
        '/个人线/': [{ text: '个人线', items: listEntries('个人线') }],
        '/其他/': [{ text: '其他', items: listFiles('其他') }]
      },
      outline: { level: [2, 4] },
      search: {
        provider: 'local',
        options: {
          locales: { root: { translations: searchTranslations } },
          miniSearch: { options: { tokenize: tokenizeCJK } }
        }
      },
      editLink: {
        pattern: 'https://github.com/GiveMeASmileQAQ/MDY-wiki/edit/main/:path',
        text: '在 GitHub 上编辑此页'
      },
      lastUpdated: {
        text: '最后更新于',
        formatOptions: { dateStyle: 'short', timeStyle: 'short' }
      },
      socialLinks: [
        {
          icon: 'github',
          link: 'https://github.com/GiveMeASmileQAQ/MDY-wiki'
        }
      ],
      footer: {
        message: '开放投稿 · 欢迎 PR · 与贴吧同步更新',
        copyright: 'Copyright © 2026 MDY-wiki 贡献者'
      }
    }
  })
)