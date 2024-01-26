import { HardhatContext } from 'hardhat/internal/context'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { TASK_LZ_DEPLOY } from '@/constants'

jest.mock('@layerzerolabs/io-devtools', () => {
    const original = jest.requireActual('@layerzerolabs/io-devtools')

    return {
        ...original,
        promptToContinue: jest.fn().mockRejectedValue('Not mocked: promptToContinue'),
        promptToSelectMultiple: jest.fn().mockRejectedValue('Not mocked: promptToSelectMultiple'),
    }
})

describe(`task ${TASK_LZ_DEPLOY}`, () => {
    /**
     * Helper utility that loads hardhat in isolation,
     * ensuring that a new copy of hardhat will be loaded
     * everytime we call this.
     *
     * This is useful since we are testing a behavior of feature flagged task
     * whose presence is determined by a env variable when hardhat is loaded
     *
     * @param {(hre: HardhatRuntimeEnvironment) => void | Promise<void>} callback Callback to be executed
     * @returns {Promise<void>}
     */
    const useIsolatedHre = (callback: (hre: HardhatRuntimeEnvironment) => void | Promise<void>): Promise<void> =>
        jest.isolateModulesAsync(async () => callback(await import('hardhat')))

    afterEach(() => {
        jest.resetModules()

        // On top of isolating the import of hardhat, we also need to wipe the HardhatContext
        // after every test, otherwise the context will be preserved and the new hardhat import
        // will fail since it will try to re-register already registered tasks
        HardhatContext.deleteHardhatContext()
    })

    describe('when LZ_ENABLE_EXPERIMENTAL_TASK_LZ_DEPLOY env feature flag is not set', () => {
        beforeEach(() => {
            process.env.LZ_ENABLE_EXPERIMENTAL_TASK_LZ_DEPLOY = ''
        })

        it('should not be available', async () => {
            await useIsolatedHre((hre) => {
                expect(hre.tasks[TASK_LZ_DEPLOY]).toBeUndefined()
            })
        })
    })

    describe('when LZ_ENABLE_EXPERIMENTAL_TASK_LZ_DEPLOY env feature flag is set', () => {
        beforeEach(() => {
            process.env.LZ_ENABLE_EXPERIMENTAL_TASK_LZ_DEPLOY = '1'
        })

        it('should be available', async () => {
            await useIsolatedHre((hre) => {
                expect(hre.tasks[TASK_LZ_DEPLOY]).not.toBeUndefined()
            })
        })

        it('should not fail if no networks are provided', async () => {
            await useIsolatedHre(async (hre) => {
                await expect(hre.run(TASK_LZ_DEPLOY, {})).resolves.toBeUndefined()
            })
        })
    })
})