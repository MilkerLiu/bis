load(":providers.bzl", "BisProjInfo")
load("@build_bazel_rules_swift//swift:swift.bzl", "SwiftInfo")

def _should_ignore_attr(attr):
    return (
        # We don't want to include implicit dependencies
        attr.startswith("_") or
        # These are actually Starklark methods, so ignore them
        attr in ("to_json", "to_proto")
    )

def _transitive_infos(*, ctx):
    transitive_infos = []
    for attr in dir(ctx.rule.attr):
        if _should_ignore_attr(attr):
            continue

        dep = getattr(ctx.rule.attr, attr)
        if type(dep) == "list":
            for dep in dep:
                if type(dep) == "Target" and BisProjInfo in dep:
                    transitive_infos.append((attr, dep[BisProjInfo]))
        elif type(dep) == "Target" and BisProjInfo in dep:
            transitive_infos.append((attr, dep[BisProjInfo]))

    return transitive_infos


def _bis_aspect_impl(target, ctx):
    swift_modules = []

    is_swift = SwiftInfo in target
    if is_swift:
        direct_modules = target[SwiftInfo].direct_modules
        for direct_module in direct_modules:
            compilation_context = direct_module.compilation_context
            if type(compilation_context) == list:
                swift_modules += compilation_context
            elif compilation_context:
                swift_modules += list(compilation_context.swiftmodules)

    transitive_infos = _transitive_infos(ctx = ctx)
    infos = [info for attr, info in transitive_infos]
    transitive_swift_modules = depset(swift_modules, transitive = [info.transitive_swift_modules for info in infos])

    return [BisProjInfo(
        direct_swift_modules = swift_modules,
        transitive_swift_modules = transitive_swift_modules,
    )]


bis_aspect = aspect(
    implementation = _bis_aspect_impl,
    attr_aspects = ["*"],
)