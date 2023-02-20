/**
 * Payload CMS Dynamic Media Plugin.
 *
 * @since     1.0.0
 * @copyright 2023 Dom Webber
 * @author    Dom Webber <dom.webber@hotmail.com>
 * @see       https://github.com/domwebber
 */

import { IncomingUploadType } from "payload/dist/uploads/types";
import type { Config } from "payload/config";
import type { Request, Response } from "express";

/**
 * Array or singular type approach.
 *
 * @since 1.0.0
 */
type Arrayable<SingularType> = SingularType | SingularType[];

/**
 * File Handling Function.
 *
 * @since 1.0.0
 */
type Handler<ReturnType> = (
  req: Request,
  res: Response,
  previous?: Handler<ReturnType>
) => ReturnType;

type ReadFileHandler = Arrayable<Handler<Buffer>>;
type UploadFileHandler = Arrayable<Handler<Buffer>>;

/**
 * Collection-specific Configuration Options.
 *
 * @since 1.0.0
 */
interface CollectionConfigOptions {
  /**
   * Read File.
   *
   * This method stands as the `GET` request handler. Defaults set at the
   * plugin-initialisation level will not be called or chained by default.
   * The plugin-level configuration for this value will be passed to the
   * first-called handler as its previous handler. Configuring this option as
   * an array will cause the last-added handler to be called first, allowing it
   * the option to waterfall backwards:
   *
   * (`Handler2 ――(calls?)―→ Handler1 ――(calls?)―→ PluginLevelHandler`)
   *
   * @since 1.0.0
   */
  readFile?: ReadFileHandler;

  /**
   * Upload File.
   *
   * This method stands as the `POST`/`PATCH`/`PUT` request handler.
   * Defaults set at the plugin-initialisation level will not be called or
   * chained by default.
   * The plugin-level configuration will be passed to the first-called
   * handler as its previous handler. Configuring this option as an array will
   * cause the last-added handler to be called first, allowing it the option to
   * waterfall backwards:
   *
   * (`Handler2 ――(calls?)―→ Handler1 ――(calls?)―→ PluginLevelHandler`)
   *
   * @since 1.0.0
   */
  uploadFile?: UploadFileHandler;

  /**
   * Appended Payload CMS Upload Handlers.
   *
   * Existing Payload CMS upload handlers will be called before internal plugin
   * handlers. These handlers will be appended to the array of upload handlers
   * after the internal plugin handlers.
   * Defaults set at the plugin-initialisation level will not be merged if this
   * option is set at a collection level.
   *
   * @since 1.0.0
   */
  handlers?: IncomingUploadType["handlers"];
}

type DynamicMediaPluginCollections =
  | string[]
  | Record<string, CollectionConfigOptions>;

interface DynamicMediaPlugin extends CollectionConfigOptions {
  /**
   * Applied collections.
   *
   * An array of strings or string-indexed configuration options. An array of
   * strings will use default config options. The string indexes stand as the
   * collection slugs.
   *
   * @since 1.0.0
   */
  collections: DynamicMediaPluginCollections;
}

/**
 * Payload CMS Dynamic Media Plugin.
 *
 * A plugin to dynamically retrieve and make-available media files from local
 * storage, third-party permanent storage, or any user-defined retrieval
 * method.
 *
 * @since 1.0.0
 * @author Dom Webber <dom.webber@hotmail.com>
 */
export default function dynamicMedia({
  collections,
  readFile: readFileDefault,
  uploadFile: uploadFileDefault,
  handlers: handlersDefault,
}: DynamicMediaPlugin) {
  return (config: Config): Config => {
    return {
      ...config,
      collections: (config.collections || []).map((existingCollection) => {
        let collectionOptions: CollectionConfigOptions = {
          readFile: readFileDefault,
          uploadFile: uploadFileDefault,
          handlers: handlersDefault,
        };

        if (typeof collections === "object" && !Array.isArray(collections)) {
          collectionOptions = {
            ...collectionOptions,
            ...collections[existingCollection.slug],
          };
        }

        return {
          ...existingCollection,

          // Set upload handlers and options.
          upload: {
            // Merge existing upload configuration options.
            ...(typeof existingCollection.upload === "object"
              ? existingCollection.upload
              : {}),

            // Existing handlers should be prepended.
            // Handlers set within the confines of the plugin should be appended.
            handlers: [
              ...(typeof existingCollection.upload === "object" &&
              Array.isArray(existingCollection.upload.handlers)
                ? existingCollection.upload.handlers
                : []),
              ...[],
              ...(typeof collectionOptions.handlers === "object" &&
              Array.isArray(collectionOptions.handlers)
                ? collectionOptions.handlers
                : []),
            ],
          },
        };
      }),
    };
  };
}
