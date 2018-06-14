import RequestManifest from './request-manifest'
import PercyAgent from './percy-agent'

export interface SnapshotOptions {
  enableJavascript?: boolean,
  widths?: number[],
  minimumHeight?: number,
}

export class PercyAgentClient {
  userAgent: string | null
  beforeSnapshot: any
  readonly defaultDoctype = '<!DOCTYPE html>'

  constructor(userAgent?: string, beforeSnapshot?: any) {
    this.userAgent = userAgent || null
    this.beforeSnapshot = beforeSnapshot || null
  }

  snapshot(name: string, options: SnapshotOptions = {}) {
    if (this.beforeSnapshot) { this.beforeSnapshot() }

    this.stabalizePage()

    let requestManifest = new RequestManifest().capture()
    let domSnapshot = this.domSnapshot()

    let percyAgent = new PercyAgent()
    // TODO: this cannot be hardcoded to this port
    percyAgent.post('http://localhost:5338/percy/snapshot', {
      name,
      url: document.URL,
      enableJavascript: options.enableJavascript,
      widths: options.widths,
      clientUserAgent: this.userAgent,
      requestManifest,
      domSnapshot
    })
  }

  private domSnapshot(): string {
    let doctype = this.getDoctype()
    let dom = document.documentElement.outerHTML

    return doctype + dom
  }

  private getDoctype(): string {
    return document.doctype ? this.doctypeToString(document.doctype) : this.defaultDoctype
  }

  private doctypeToString(doctype: DocumentType): string {
    const publicDeclaration = doctype.publicId ? ` PUBLIC "${doctype.publicId}" ` : ''
    const systemDeclaration = doctype.systemId ? ` SYSTEM "${doctype.systemId}" ` : ''

    return `<!DOCTYPE ${doctype.name}` + publicDeclaration + systemDeclaration + '>'
  }

  private stabalizePage() {
    // Apply various hacks to the pages
    // freeze jQuery etc.
  }
}
