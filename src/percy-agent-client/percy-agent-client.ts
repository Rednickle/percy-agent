interface Request {
  name: string
}

class RequestManifest {
  capture(): string[] {
    let requests: Request[] = performance.getEntriesByType('resource')
    return requests.map(request => request.name)
  }
}

interface SnapshotOptions {
  enableJavascript?: boolean,
  widths?: number[],
  minimumHeight?: number,
}

class Percy {
  clientUserAgent: string | null
  beforeSnapshot: any
  readonly defaultDoctype = '<!DOCTYPE html>'

  constructor(clientUserAgent?: string, beforeSnapshot?: any) {
    this.clientUserAgent = clientUserAgent || null
    this.beforeSnapshot = beforeSnapshot || null
  }

  snapshot(name: string, options: SnapshotOptions) {
    if (this.beforeSnapshot) { this.beforeSnapshot() }
    this.stabalizePage()

    let requestManifest = new RequestManifest().capture()
    let domSnapshot = this.domSnapshot()

    let percyAgent = new PercyAgent()
    percyAgent.post('http://localhost:5338/percy/snapshot', {
      name,
      url: document.URL,
      enableJavascript: options.enableJavascript,
      widths: options.widths,
      clientUserAgent: this.clientUserAgent,
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

class PercyAgent {
  post(url: string, data: any) {
    const xhr = new XMLHttpRequest()

    xhr.open('post', url, false) // synchronous request
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(JSON.stringify(data))
  }
}