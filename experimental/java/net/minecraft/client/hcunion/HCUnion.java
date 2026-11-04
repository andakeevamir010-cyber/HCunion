package net.minecraft.client.hcunion;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import net.lax1dude.eaglercraft.v1_8.EagRuntime;
import net.lax1dude.eaglercraft.v1_8.Keyboard;
import net.minecraft.client.Minecraft;
import net.minecraft.client.entity.EntityPlayerSP;
import net.minecraft.client.gui.GuiScreen;
import net.minecraft.entity.player.EntityPlayer;
import net.minecraft.item.ItemStack;
import net.minecraft.item.ItemSword;
import net.minecraft.util.AxisAlignedBB;
import net.minecraft.util.MathHelper;
import net.minecraft.util.MovingObjectPosition;
import net.minecraft.util.Vec3;

/**
 * HCUnion for EaglercraftX 1.8 (WASM-GC / JS).
 *
 *  Right Shift ........ open the mods menu
 *  I (default) ........ looking at a player: lock onto them, Aim Assist + Auto Clicker turn ON
 *                       pressing I again (looking at them or not): release, both turn OFF
 *
 * Integration requirements:
 *   1. Call HCUnion.onFrame(this) once per client frame from Minecraft.runGameLoop().
 *   2. Expose Minecraft.clickMouse() to this package (or add a package-safe attack bridge).
 *   3. Optionally call HCUnion.renderHud(this.mc) from GuiIngame.renderGameOverlay().
 *
 * This class is source code only; it is not loaded by the browser wrapper automatically.
 */
public class HCUnion {

    static final Random RND = new Random();
    static final List<Module> MODULES = new ArrayList<Module>();

    public static final AimAssist aim = new AimAssist();
    public static final AutoClicker clicker = new AutoClicker();

    static EntityPlayer lockTarget = null;

    private static boolean prevRShift, prevAimKey, prevClickKey;
    private static long lastFrame = System.currentTimeMillis();

    static {
        MODULES.add(aim);
        MODULES.add(clicker);
        load();
    }

    // ------------------------------------------------------------------ main hook

    /** Call once per frame (first line of Minecraft.runGameLoop). */
    public static void onFrame(Minecraft mc) {
        long now = System.currentTimeMillis();
        double dt = Math.min((now - lastFrame) / 1000.0, 0.1);
        lastFrame = now;

        // edge-detect keys every frame so nothing is missed
        boolean rs = Keyboard.isKeyDown(Keyboard.KEY_RSHIFT);
        boolean ak = aim.key.code != 0 && Keyboard.isKeyDown(aim.key.code);
        boolean ck = clicker.key.code != 0 && Keyboard.isKeyDown(clicker.key.code);
        boolean rsPressed = rs && !prevRShift;
        boolean akPressed = ak && !prevAimKey;
        boolean ckPressed = ck && !prevClickKey;
        prevRShift = rs;
        prevAimKey = ak;
        prevClickKey = ck;

        if (mc.thePlayer == null || mc.theWorld == null) {
            lockTarget = null;
            return;
        }
        if (mc.currentScreen != null) {
            clicker.next = 0;
            return;
        }

        if (rsPressed) {
            mc.displayGuiScreen(new ClickGui());
            return;
        }
        if (akPressed) {
            toggleLock(mc);
        }
        if (ckPressed && clicker.key.code != aim.key.code) {
            clicker.enabled = !clicker.enabled;
        }

        if (aim.enabled) {
            aim.update(mc, dt);
        }
        clicker.update(mc);
    }

    /** Optional HUD list (top-left). */
    public static void renderHud(Minecraft mc) {
        int y = 4;
        for (Module m : MODULES) {
            if (!m.enabled) continue;
            String s = m.name;
            if (m == aim && lockTarget != null) {
                s = s + " [" + lockTarget.getName() + "]";
            }
            mc.fontRendererObj.drawStringWithShadow(s, 4, y, 0x55FF55);
            y += 10;
        }
    }

    // ------------------------------------------------------------------ lock logic

    static void toggleLock(Minecraft mc) {
        if (lockTarget != null) {
            release();           // locked -> any press lets go
            return;
        }
        EntityPlayer p = lookingAt(mc, aim.range.v);
        if (p != null) {
            lockTarget = p;
            aim.enabled = true;
            clicker.enabled = true;   // auto clicker turns on with the lock
            clicker.next = 0;
        }
    }

    static void release() {
        lockTarget = null;
        aim.enabled = false;
        clicker.enabled = false;
    }

    /** Closest player under the crosshair within range. */
    static EntityPlayer lookingAt(Minecraft mc, double range) {
        EntityPlayerSP me = mc.thePlayer;
        Vec3 eye = me.getPositionEyes(1.0F);
        Vec3 look = me.getLook(1.0F);
        Vec3 end = eye.addVector(look.xCoord * range, look.yCoord * range, look.zCoord * range);
        EntityPlayer best = null;
        double bestDist = Double.MAX_VALUE;
        for (EntityPlayer p : mc.theWorld.playerEntities) {
            if (p == me || p.isDead || p.isSpectator()) continue;
            AxisAlignedBB bb = p.getEntityBoundingBox().expand(0.1, 0.1, 0.1);
            double d;
            if (bb.isVecInside(eye)) {
                d = 0.0;
            } else {
                MovingObjectPosition r = bb.calculateIntercept(eye, end);
                if (r == null) continue;
                d = eye.distanceTo(r.hitVec);
            }
            if (d < bestDist && me.canEntityBeSeen(p)) {
                bestDist = d;
                best = p;
            }
        }
        return best;
    }

    static boolean holdingSword(Minecraft mc) {
        ItemStack s = mc.thePlayer.getHeldItem();
        return s != null && s.getItem() instanceof ItemSword;
    }

    // ------------------------------------------------------------------ settings

    static abstract class Setting {
        final String name;
        Setting(String n) { name = n; }
        abstract String save();
        abstract void load(String s);
    }

    static class Bool extends Setting {
        boolean v;
        Bool(String n, boolean d) { super(n); v = d; }
        String save() { return v ? "true" : "false"; }
        void load(String s) { v = "true".equals(s); }
    }

    static class Num extends Setting {
        double v;
        final double min, max, step;
        Num(String n, double d, double min, double max, double step) {
            super(n);
            this.min = min; this.max = max; this.step = step;
            this.v = d;
        }
        void set(double x) {
            x = Math.max(min, Math.min(max, x));
            x = Math.round((x - min) / step) * step + min;
            x = Math.max(min, Math.min(max, x));
            v = Math.round(x * 1000.0) / 1000.0;
        }
        String save() { return String.valueOf(v); }
        void load(String s) {
            try { set(Double.parseDouble(s)); } catch (Exception ignored) { }
        }
        String display() {
            if (step >= 1.0) return String.valueOf((int) v);
            return String.valueOf(Math.round(v * 100.0) / 100.0);
        }
    }

    static class Key extends Setting {
        int code;
        Key(String n, int d) { super(n); code = d; }
        String save() { return String.valueOf(code); }
        void load(String s) {
            try { code = Integer.parseInt(s); } catch (Exception ignored) { }
        }
        String display() { return code == 0 ? "NONE" : Keyboard.getKeyName(code); }
    }

    static abstract class Module {
        final String name;
        boolean enabled = false;
        final List<Setting> settings = new ArrayList<Setting>();
        Module(String n) { name = n; }
        <T extends Setting> T add(T s) { settings.add(s); return s; }
    }

    // ------------------------------------------------------------------ Aim Assist

    static class AimAssist extends Module {
        final Key  key        = add(new Key("Keybind (lock)", Keyboard.KEY_I));
        final Num  range      = add(new Num("Range", 6.0, 1.0, 20.0, 0.1));
        final Num  fov        = add(new Num("FOV (no lock)", 90, 10, 360, 5));
        final Num  speed      = add(new Num("Speed", 40, 1, 100, 1));
        final Num  vSpeed     = add(new Num("Vertical speed %", 60, 0, 100, 5));
        final Num  random     = add(new Num("Randomization %", 20, 0, 80, 1));
        final Num  aimPoint   = add(new Num("Aim height %", 70, 10, 100, 5));
        final Bool vertical   = add(new Bool("Vertical aim", true));
        final Bool weaponOnly = add(new Bool("Sword only", true));
        final Bool onlyClick  = add(new Bool("Only while clicking", false));
        final Bool visible    = add(new Bool("Visible only", true));
        final Bool ignoreInv  = add(new Bool("Ignore invisible", true));
        final Bool stopOn     = add(new Bool("Stop when on target", true));

        AimAssist() { super("Aim Assist"); }

        EntityPlayer target(Minecraft mc) {
            EntityPlayerSP me = mc.thePlayer;
            if (lockTarget != null) {
                if (lockTarget.isDead || lockTarget.getHealth() <= 0.0F
                        || !mc.theWorld.playerEntities.contains(lockTarget)) {
                    release();              // target died / left
                    return null;
                }
                if (me.getDistanceToEntity(lockTarget) > range.v) return null;
                if (ignoreInv.v && lockTarget.isInvisible()) return null;
                if (visible.v && !me.canEntityBeSeen(lockTarget)) return null;
                return lockTarget;
            }
            // enabled from the menu without a lock: nearest player inside FOV
            EntityPlayer best = null;
            double bestDist = range.v;
            for (EntityPlayer p : mc.theWorld.playerEntities) {
                if (p == me || p.isDead || p.isSpectator() || p.getHealth() <= 0.0F) continue;
                if (ignoreInv.v && p.isInvisible()) continue;
                double d = me.getDistanceToEntity(p);
                if (d > bestDist) continue;
                if (visible.v && !me.canEntityBeSeen(p)) continue;
                if (Math.abs(angles(mc, p)[0]) > fov.v / 2.0) continue;
                bestDist = d;
                best = p;
            }
            return best;
        }

        /** {yaw difference, pitch difference} from current view to target */
        double[] angles(Minecraft mc, EntityPlayer t) {
            EntityPlayerSP me = mc.thePlayer;
            double dx = t.posX - me.posX;
            double dz = t.posZ - me.posZ;
            double dy = (t.posY + t.height * (aimPoint.v / 100.0)) - (me.posY + me.getEyeHeight());
            double flat = Math.sqrt(dx * dx + dz * dz);
            float yawTo = (float) (Math.atan2(dz, dx) * 180.0 / Math.PI) - 90.0F;
            float pitchTo = (float) (-(Math.atan2(dy, flat) * 180.0 / Math.PI));
            return new double[] {
                    MathHelper.wrapAngleTo180_float(yawTo - me.rotationYaw),
                    pitchTo - me.rotationPitch };
        }

        void update(Minecraft mc, double dt) {
            if (weaponOnly.v && !holdingSword(mc)) return;
            if (onlyClick.v && !mc.gameSettings.keyBindAttack.isKeyDown()) return;
            EntityPlayer t = target(mc);
            if (t == null) return;

            double[] a = angles(mc, t);
            double dYaw = a[0];
            double dPitch = a[1];
            if (stopOn.v) {
                if (Math.abs(dYaw) < 1.0) dYaw = 0;
                if (Math.abs(dPitch) < 1.0) dPitch = 0;
            }

            double frac = 1.0 - Math.exp(-speed.v * 0.12 * dt);
            frac *= 1.0 + (RND.nextDouble() - 0.5) * 2.0 * (random.v / 100.0);
            frac = Math.max(0.0, Math.min(1.0, frac));

            float yawAdd = (float) (dYaw * frac);
            float pitchAdd = vertical.v ? (float) (dPitch * frac * (vSpeed.v / 100.0)) : 0.0F;

            EntityPlayerSP me = mc.thePlayer;
            me.rotationYaw += yawAdd;
            me.prevRotationYaw += yawAdd;
            me.rotationPitch = MathHelper.clamp_float(me.rotationPitch + pitchAdd, -90.0F, 90.0F);
            me.prevRotationPitch = MathHelper.clamp_float(me.prevRotationPitch + pitchAdd, -90.0F, 90.0F);
        }
    }

    // ------------------------------------------------------------------ Auto Clicker

    static class AutoClicker extends Module {
        final Key  key        = add(new Key("Keybind", 0));
        final Num  minCps     = add(new Num("Min CPS", 8, 1, 20, 1));
        final Num  maxCps     = add(new Num("Max CPS", 12, 1, 20, 1));
        final Num  drops      = add(new Num("CPS drops %", 10, 0, 50, 1));
        final Num  jitter     = add(new Num("Jitter", 0, 0, 3, 0.1));
        final Bool swordOnly  = add(new Bool("Sword only", true));
        final Bool onTarget   = add(new Bool("Only when on a player", true));
        final Bool needHold   = add(new Bool("Only while holding LMB", false));

        long next = 0;

        AutoClicker() { super("Auto Clicker"); }

        long delay() {
            double lo = Math.min(minCps.v, maxCps.v);
            double hi = Math.max(minCps.v, maxCps.v);
            double cps = lo + RND.nextDouble() * (hi - lo);
            double d = 1000.0 / cps;
            d *= 0.85 + RND.nextDouble() * 0.30;
            if (RND.nextInt(100) < (int) drops.v) {
                d *= 1.4 + RND.nextDouble() * 0.8;     // occasional slower click
            }
            return (long) d;
        }

        void update(Minecraft mc) {
            // never clicks unless enabled (via the I lock, its own key, or the menu)
            if (!enabled) { next = 0; return; }
            if (swordOnly.v && !holdingSword(mc)) { next = 0; return; }
            if (needHold.v && !mc.gameSettings.keyBindAttack.isKeyDown()) { next = 0; return; }
            if (onTarget.v && (mc.objectMouseOver == null
                    || !(mc.objectMouseOver.entityHit instanceof EntityPlayer))) return;

            long now = System.currentTimeMillis();
            if (next == 0) next = now;
            if (now >= next) {
                mc.clickMouse();
                next = now + delay();
                if (jitter.v > 0.0) {
                    float jy = (float) ((RND.nextDouble() - 0.5) * jitter.v);
                    float jp = (float) ((RND.nextDouble() - 0.5) * jitter.v);
                    EntityPlayerSP me = mc.thePlayer;
                    me.rotationYaw += jy;
                    me.prevRotationYaw += jy;
                    me.rotationPitch = MathHelper.clamp_float(me.rotationPitch + jp, -90.0F, 90.0F);
                    me.prevRotationPitch = MathHelper.clamp_float(me.prevRotationPitch + jp, -90.0F, 90.0F);
                }
            }
        }
    }

    // ------------------------------------------------------------------ config (browser storage)

    private static final String STORAGE_KEY = "hcunion";

    static void save() {
        try {
            StringBuilder sb = new StringBuilder();
            for (Module m : MODULES) {
                for (Setting s : m.settings) {
                    sb.append(m.name).append('.').append(s.name).append('=').append(s.save()).append('\n');
                }
            }
            EagRuntime.setStorage(STORAGE_KEY, sb.toString().getBytes(StandardCharsets.UTF_8));
        } catch (Throwable ignored) { }
    }

    static void load() {
        try {
            byte[] b = EagRuntime.getStorage(STORAGE_KEY);
            if (b == null) return;
            String[] lines = new String(b, StandardCharsets.UTF_8).split("\n");
            for (String line : lines) {
                int eq = line.indexOf('=');
                if (eq < 0) continue;
                String k = line.substring(0, eq);
                String v = line.substring(eq + 1);
                for (Module m : MODULES) {
                    for (Setting s : m.settings) {
                        if ((m.name + "." + s.name).equals(k)) s.load(v);
                    }
                }
            }
        } catch (Throwable ignored) { }
    }

    // ------------------------------------------------------------------ menu (Right Shift)

    public static class ClickGui extends GuiScreen {
        private static final int W = 140, ROW = 12, HEAD = 16, TOP = 12, GAP = 8;
        private final long opened = System.currentTimeMillis();
        private Setting listening = null;
        private Num dragging = null;
        private int dragX = 0;

        // Settings flow into extra columns when a module is taller than the screen,
        // so nothing runs off the bottom on small screens.
        private int rowsPerCol() {
            return Math.max(4, (this.height - TOP - HEAD - 16) / ROW);
        }

        private int subCols(Module m) {
            int r = rowsPerCol();
            return Math.max(1, (m.settings.size() + r - 1) / r);
        }

        private int modX(int mi) {
            int x = 8;
            for (int i = 0; i < mi; i++) {
                x += subCols(MODULES.get(i)) * (W + GAP);
            }
            return x;
        }

        private int setX(int mi, int j) {
            return modX(mi) + (j / rowsPerCol()) * (W + GAP);
        }

        private int setY(int j) {
            return TOP + HEAD + (j % rowsPerCol()) * ROW;
        }

        @Override
        public void drawScreen(int mouseX, int mouseY, float partialTicks) {
            drawRect(0, 0, this.width, this.height, 0x66000000);
            for (int i = 0; i < MODULES.size(); i++) {
                Module m = MODULES.get(i);
                int x0 = modX(i);
                int hw = subCols(m) * (W + GAP) - GAP;
                drawRect(x0, TOP, x0 + hw, TOP + HEAD, m.enabled ? 0xFF2E7D32 : 0xFF3A3A3A);
                this.fontRendererObj.drawStringWithShadow(m.name + (m.enabled ? "  [ON]" : "  [OFF]"), x0 + 4, TOP + 4, 0xFFFFFF);
                for (int j = 0; j < m.settings.size(); j++) {
                    drawRow(m.settings.get(j), setX(i, j), setY(j));
                }
            }
            this.fontRendererObj.drawStringWithShadow(
                    "Click title = toggle | drag sliders | click keybind then press a key (Esc = none) | Right Shift / Esc = close",
                    8, this.height - 10, 0xAAAAAA);
        }

        private void drawRow(Setting s, int x, int y) {
            drawRect(x, y, x + W, y + ROW, 0xDD121212);
            if (s instanceof Bool) {
                Bool b = (Bool) s;
                this.fontRendererObj.drawStringWithShadow(b.name, x + 4, y + 2, 0xDDDDDD);
                String t = b.v ? "ON" : "OFF";
                this.fontRendererObj.drawStringWithShadow(t, x + W - 4 - this.fontRendererObj.getStringWidth(t), y + 2, b.v ? 0x55FF55 : 0xFF5555);
            } else if (s instanceof Num) {
                Num n = (Num) s;
                int fill = (int) ((n.v - n.min) / (n.max - n.min) * W);
                drawRect(x, y, x + fill, y + ROW, 0xAA2E7D32);
                this.fontRendererObj.drawStringWithShadow(n.name, x + 4, y + 2, 0xFFFFFF);
                String t = n.display();
                this.fontRendererObj.drawStringWithShadow(t, x + W - 4 - this.fontRendererObj.getStringWidth(t), y + 2, 0xFFFFFF);
            } else if (s instanceof Key) {
                Key k = (Key) s;
                this.fontRendererObj.drawStringWithShadow(k.name, x + 4, y + 2, 0xDDDDDD);
                String t = (listening == k) ? "press a key..." : k.display();
                this.fontRendererObj.drawStringWithShadow(t, x + W - 4 - this.fontRendererObj.getStringWidth(t), y + 2, 0xFFFF55);
            }
        }

        @Override
        protected void mouseClicked(int mouseX, int mouseY, int button) {
            if (button != 0) return;
            for (int i = 0; i < MODULES.size(); i++) {
                Module m = MODULES.get(i);
                int x0 = modX(i);
                int hw = subCols(m) * (W + GAP) - GAP;
                if (mouseX >= x0 && mouseX <= x0 + hw && mouseY >= TOP && mouseY < TOP + HEAD) {
                    m.enabled = !m.enabled;
                    if (m == aim && !m.enabled) lockTarget = null;
                    return;
                }
                for (int j = 0; j < m.settings.size(); j++) {
                    int x = setX(i, j);
                    int y = setY(j);
                    if (mouseX >= x && mouseX <= x + W && mouseY >= y && mouseY < y + ROW) {
                        Setting s = m.settings.get(j);
                        if (s instanceof Bool) {
                            ((Bool) s).v = !((Bool) s).v;
                        } else if (s instanceof Num) {
                            dragging = (Num) s;
                            dragX = x;
                            slide(mouseX);
                        } else if (s instanceof Key) {
                            listening = s;
                        }
                        return;
                    }
                }
            }
        }

        private void slide(int mouseX) {
            double f = Math.max(0.0, Math.min(1.0, (mouseX - dragX) / (double) W));
            dragging.set(dragging.min + f * (dragging.max - dragging.min));
        }

        @Override
        protected void mouseClickMove(int mouseX, int mouseY, int button, long time) {
            if (dragging != null) slide(mouseX);
        }

        @Override
        protected void mouseReleased(int mouseX, int mouseY, int state) {
            dragging = null;
        }

        @Override
        protected void keyTyped(char c, int keyCode) {
            if (listening != null) {
                ((Key) listening).code = (keyCode == Keyboard.KEY_ESCAPE) ? 0 : keyCode;
                listening = null;
                return;
            }
            // ignore the same Right Shift press that opened the menu
            if (System.currentTimeMillis() - opened < 200) return;
            if (keyCode == Keyboard.KEY_RSHIFT || keyCode == Keyboard.KEY_ESCAPE) {
                this.mc.displayGuiScreen(null);
            }
        }

        @Override
        public void onGuiClosed() {
            save();
        }

        @Override
        public boolean doesGuiPauseGame() {
            return false;
        }
    }
}