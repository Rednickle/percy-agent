import * as childProcess from 'child_process'
import * as fs from 'fs'

export default class ProcessService {
  static pidPath = './.percy-agent.pid'
  static logPath = './log/percy-agent.log'

  /**
   * Runs the given args as a spawned, detached child process and returns a pid.
   * If the process is already running, `null` is returned.
   */
  async runDetached(args: string[]): Promise<number | null> {
    if (await this.isRunning()) { return null }

    const logFile = fs.openSync(ProcessService.logPath, 'a+')

    const spawnedProcess = childProcess.spawn(process.argv[0], args, {
      detached: false,
      stdio: ['ignore', logFile, logFile] // logs and errors go into the same file
    })

    await this.writePidFile(spawnedProcess.pid)

    spawnedProcess.unref()
    return spawnedProcess.pid
  }

  async isRunning(): Promise<boolean> {
    return fs.existsSync(ProcessService.pidPath)
  }

  async getPid(): Promise<number> {
    let pidFileContents: Buffer = await fs.readFileSync(ProcessService.pidPath)
    return parseInt(pidFileContents.toString('utf8').trim())
  }

  async kill(force = false) {
    if (await !this.isRunning()) {
      return
    } else {
      const pid = await this.getPid()

      await fs.unlinkSync(ProcessService.pidPath)
      let signal = 'SIGHUP'
      if (force) { signal = 'SIGKILL' }

      process.kill(pid, signal)
    }
  }

  private async writePidFile(pid: number) {
    await fs.writeFileSync(ProcessService.pidPath, pid)
  }
}